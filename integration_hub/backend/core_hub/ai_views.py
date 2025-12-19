"""
AI Views for Auto-Mapping functionality.
Uses Gemini AI for semantic analysis and field mapping suggestions.
"""
import json
import re
import os
from pathlib import Path
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
import logging

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent / '.env'
    load_dotenv(env_path)
except ImportError:
    pass

logger = logging.getLogger(__name__)

# Gemini API Key
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')


def get_gemini_model():
    """Initialize and return Gemini model."""
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured. Please set it in .env file.")
    
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-2.5-flash-lite')


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def auto_map(request):
    """
    AI-powered auto-mapping endpoint.
    Uses schema fields from manifest.json to suggest mappings.
    
    Request:
        - source_fields: JSON array of source schema field names
        - target_fields: JSON array of target schema field names
    
    Response:
        - detected_fields: List of target field labels
        - suggestions: List of mapping suggestions with confidence scores
    """
    try:
        source_fields_json = request.data.get('source_fields', '[]')
        target_fields_json = request.data.get('target_fields', '[]')
        
        try:
            source_fields = json.loads(source_fields_json)
        except json.JSONDecodeError:
            source_fields = []
        
        try:
            target_fields = json.loads(target_fields_json)
        except json.JSONDecodeError:
            target_fields = []
        
        # Validate inputs
        if not target_fields:
            return Response(
                {"error": "No target_fields provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not source_fields:
            return Response(
                {"error": "No source_fields provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize Gemini
        model = get_gemini_model()
        
     # AI Prompt for Schema-to-Schema mapping
        prompt = f"""
You are an expert Data Integration Analyst and Schema Mapper. Your specialty is semantic mapping between disparate data structures, specifically handling cross-language matches (e.g., Portuguese to English) and complex nested objects.

### TASK
Map EVERY field from the TARGET list to the best corresponding field in the SOURCE list.

### INPUT DATA
SOURCE SCHEMA (Origin):
{json.dumps(source_fields, indent=2)}

TARGET SCHEMA (Destination):
{json.dumps(target_fields, indent=2)}

### MAPPING RULES
1. **Semantic Matching:** Prioritize meaning over exact name matches.
   - Example: "razao_social" (PT) matches "company_legal_name" (EN).
   - Example: "celular" matches "mobile_phone".
   - Example: "cnpj" matches "id".
2. **Flattening:** The source may be nested. Use JSONPath notation for source fields (e.g., "$.address.city").
3. **Data Types:** If a source field implies a different type than the target (e.g., string "100" -> integer 100), suggest a CAST transformation.
4. **Completeness:** You MUST provide a mapping for ALL {len(target_fields)} target fields.
   - If a strong match is not found, select the most logically related field and assign a low confidence score (< 30).

### AVAILABLE TRANSFORMATIONS
- "UPPERCASE", "LOWERCASE", "TRIM"
- "TO_INT", "TO_FLOAT", "TO_STRING", "TO_BOOLEAN"
- "DATE_FORMAT(source_fmt -> target_fmt)"
- "EXTRACT_DIGITS" (for phones/docs)
- "" (empty string if no transform needed)

### OUTPUT FORMAT
Return strictly a JSON Array containing objects with the following structure. Do not include markdown formatting (like ```json).

Output JSON Structure:
[
  {{
    "source_path": "String (e.g., '$.user.name')",
    "target_field": "String (exact name from target list)",
    "confidence": Integer (0-100),
    "transform": "String (one of the available transformations)",
    "reasoning": "String (Short explanation of the logic)"
  }}
]

REMEMBER: Return ONLY the JSON array. No prologue, no epilogue.
"""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown if present
        if response_text.startswith('```'):
            response_text = re.sub(r'^```\w*\n?', '', response_text)
            response_text = re.sub(r'\n?```$', '', response_text)
        
        suggestions = json.loads(response_text)
        
        # Sort by confidence descending
        if suggestions:
            suggestions.sort(key=lambda x: x.get('confidence', 0), reverse=True)
        
        return Response({
            "detected_fields": target_fields,
            "suggestions": suggestions,
            "ai_powered": True
        })
        
    except ValueError as e:
        # Configuration errors (like missing API key)
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Auto-map error: {e}", exc_info=True)
        return Response(
            {"error": f"AI processing error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
