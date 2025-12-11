from rest_framework import serializers
from .models import IntegrationProfile, MappingTemplate, MappingVersion, ExecutionLog

class IntegrationProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationProfile
        fields = '__all__'

class MappingVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MappingVersion
        fields = '__all__'

class MappingTemplateSerializer(serializers.ModelSerializer):
    source_details = IntegrationProfileSerializer(source='source', read_only=True)
    target_details = IntegrationProfileSerializer(source='target', read_only=True)
    active_version_details = MappingVersionSerializer(source='active_version', read_only=True)

    class Meta:
        model = MappingTemplate
        fields = '__all__'

class ExecutionLogSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    
    class Meta:
        model = ExecutionLog
        fields = '__all__'
