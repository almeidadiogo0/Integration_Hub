from django.contrib import admin
from .models import IntegrationProfile, MappingTemplate, MappingVersion, ExecutionLog

@admin.register(IntegrationProfile)
class IntegrationProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'created_at')
    list_filter = ('type',)
    search_fields = ('name',)

@admin.register(MappingTemplate)
class MappingTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'source', 'target', 'active_version', 'updated_at')
    search_fields = ('name',)

@admin.register(MappingVersion)
class MappingVersionAdmin(admin.ModelAdmin):
    list_display = ('template', 'version_number', 'created_at')
    list_filter = ('template',)

@admin.register(ExecutionLog)
class ExecutionLogAdmin(admin.ModelAdmin):
    list_display = ('template', 'status', 'timestamp')
    list_filter = ('status', 'template')
    readonly_fields = ('input_data', 'output_data', 'error_message')
