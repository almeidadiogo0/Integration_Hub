from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import IntegrationProfile, MappingTemplate, MappingVersion, ExecutionLog
from .serializers import (
    IntegrationProfileSerializer, MappingTemplateSerializer, 
    MappingVersionSerializer, ExecutionLogSerializer
)
from .engine import TransformationEngine
from .utils import DataFetcher, DataSender
import json
import logging

logger = logging.getLogger(__name__)

class IntegrationProfileViewSet(viewsets.ModelViewSet):
    queryset = IntegrationProfile.objects.all()
    serializer_class = IntegrationProfileSerializer

class MappingTemplateViewSet(viewsets.ModelViewSet):
    queryset = MappingTemplate.objects.all()
    serializer_class = MappingTemplateSerializer

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt
async def execute_template_async(request, pk=None):
    """
    Executes a mapping template (ASYNC).
    """
    if request.method != 'POST':
        return JsonResponse({"error": "Method not allowed"}, status=405)

    # Async ORM Fetch with select_related to avoid lazy loading issues
    try:
        template = await MappingTemplate.objects.select_related('source', 'target', 'active_version').aget(pk=pk)
    except MappingTemplate.DoesNotExist:
            return JsonResponse({"error": "Template not found"}, status=404)

    input_data = None
    
    # Parse body
    try:
        body_data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Malformed JSON payload"}, status=400)

    is_test = body_data.get('is_test', False)
    
    try:
        input_data = body_data.get('data')
        
        # WEBOOK SUPPORT: If Source has no API URL (Passive), and no 'data' wrapper is found
        if not input_data and not template.source.api_url:
            input_data = body_data
            
        # Fetch Logic
        if not input_data:
            if not template.source.api_url:
                raise ValueError("No input payload provided for Passive Source")
            
            fetch_params = body_data.get('params', {})
            try:
                # Active Fetch ASYNC
                input_data = await DataFetcher.fetch_data(template.source, fetch_params)
            except Exception as e:
                    raise ValueError(f"Fetch Error: {str(e)}")

        # Get active version rules
        if not template.active_version:
                raise ValueError("No active version found for this template")
        
        rules = template.active_version.rules
        output_data = {}
        
        # Helper to get value by path
        def get_value_by_path(data, path):
            if path.startswith('$.'):
                path = path[2:]
            parts = path.split('.')
            current = data
            for part in parts:
                if isinstance(current, dict) and part in current:
                    current = current[part]
                elif isinstance(current, list) and part.isdigit():
                    try:
                        idx = int(part)
                        if 0 <= idx < len(current):
                            current = current[idx]
                        else:
                            return None
                    except (ValueError, IndexError):
                        return None
                else:
                    return None
            return current

        # Engine Execution (CPU bound, fast enough to run in main thread for now)
        for rule in rules:
            source_path = rule.get('source_path', '')
            target_field = rule.get('target_field', '')
            transform = rule.get('transform', '')

            raw_value = get_value_by_path(input_data, source_path)
            transformed_value = TransformationEngine.apply(raw_value, transform)
            output_data[target_field] = transformed_value

        # Add template ID to the output data
        output_data['template_id'] = template.id

        # Send to Target ASYNC
        target_response = None
        if template.target:
            target_response = await DataSender.send_data(template.target, output_data)

        # Log execution ASYNC
        await ExecutionLog.objects.acreate(
            template=template,
            version=template.active_version,
            status='SUCCESS',
            input_data=input_data,
            output_data=output_data,
            is_test=is_test
        )

        return JsonResponse({
            "mapped_data": output_data,
            "target_response": target_response
        })

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Execution failed: {error_msg}", exc_info=True)
        # Safe Logging ASYNC
        try:
            # We can't access template.active_version easily if template failed to load
            if 'template' in locals():
                await ExecutionLog.objects.acreate(
                    template=template,
                    version=template.active_version if template.active_version else None,
                    status='ERROR',
                    input_data=input_data if 'input_data' in locals() else None,
                    error_message=error_msg,
                    is_test=is_test
                )
        except Exception as log_error:
            logger.error(f"Failed to save error log: {log_error}", exc_info=True)
            
        status_code = 400 if isinstance(e, ValueError) else 500
        return JsonResponse({"error": error_msg}, status=status_code)

class MappingVersionViewSet(viewsets.ModelViewSet):
    queryset = MappingVersion.objects.all()
    serializer_class = MappingVersionSerializer

class ExecutionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExecutionLog.objects.all()
    serializer_class = ExecutionLogSerializer
