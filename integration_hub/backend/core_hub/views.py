from rest_framework import viewsets, status
from rest_framework.decorators import action
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

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """
        Executes a mapping template.
        Mode 1 (Passive): Input: { "data": { ... } } -> Mapping -> Output
        Mode 2 (Active): Input: { "params": { "cnpj": "..." } } -> Fetch Source -> Mapping -> Output
        """
        template = self.get_object()
        input_data = request.data.get('data')
        
        # Valid JSON check (drf parses it, but let's check structure)
        if request.data and not isinstance(request.data, dict):
             return Response({"error": "Malformed JSON payload"}, status=status.HTTP_400_BAD_REQUEST)
        
        # WEBOOK SUPPORT: If Source has no API URL (Passive), and no 'data' wrapper is found,
        # treat the entire body as the input payload.
        if not input_data and not template.source.api_url:
            input_data = request.data
            
        # If still no input_data and we HAVE an API URL, we need to fetch.
        if not input_data:
            if not template.source.api_url:
                # This case is now covered above (input_data = request.data), unless body is empty.
                return Response({"error": "No input payload provided for Passive Source"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Use 'params' from request for URL substitution if any
            fetch_params = request.data.get('params', {})
            try:
                # Active Fetch
                input_data = DataFetcher.fetch_data(template.source, fetch_params)
            except Exception as e:
                 return Response({"error": f"Fetch Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Get active version rules
        if not template.active_version:
             return Response({"error": "No active version found for this template"}, status=status.HTTP_400_BAD_REQUEST)
        
        rules = template.active_version.rules
        output_data = {}
        
        try:
            # Simple execution engine logic
            # Rule format: { "source_path": "$.company.tax_id", "target_field": "tax_id", "transform": "REMOVE_PUNCTUATION" }
            
            # Helper to get value by path (supports dict keys and list indices)
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

            for rule in rules:
                source_path = rule.get('source_path', '')
                target_field = rule.get('target_field', '')
                transform = rule.get('transform', '')

                raw_value = get_value_by_path(input_data, source_path)
                transformed_value = TransformationEngine.apply(raw_value, transform)
                
                # Assign to output (assuming flat structure for now for simplicity, but could be nested)
                output_data[target_field] = transformed_value

            # NEW: Send to Target
            target_response = None
            if template.target:
                # Use DataSender to post data
                target_response = DataSender.send_data(template.target, output_data)

            # Log execution
            ExecutionLog.objects.create(
                template=template,
                version=template.active_version,
                status='SUCCESS',
                input_data=input_data,
                output_data=output_data
            )

            return Response({
                "mapped_data": output_data,
                "target_response": target_response
            })

        except Exception as e:
            error_msg = str(e)
            ExecutionLog.objects.create(
                template=template,
                version=template.active_version,
                status='ERROR',
                input_data=input_data,
                error_message=error_msg
            )
            return Response({"error": error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MappingVersionViewSet(viewsets.ModelViewSet):
    queryset = MappingVersion.objects.all()
    serializer_class = MappingVersionSerializer

class ExecutionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExecutionLog.objects.all()
    serializer_class = ExecutionLogSerializer
