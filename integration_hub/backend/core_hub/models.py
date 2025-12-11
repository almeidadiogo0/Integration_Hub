from django.db import models
import uuid

class IntegrationProfile(models.Model):
    TYPE_CHOICES = [
        ('SOURCE', 'Source'),
        ('TARGET', 'Target'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    api_url = models.URLField(blank=True, null=True)
    auth_config = models.JSONField(default=dict, blank=True) # For tokens/secrets (Encrypt in production!)
    schema = models.JSONField(default=dict, blank=True) # Defines expected fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"

class MappingTemplate(models.Model):
    name = models.CharField(max_length=255)
    source = models.ForeignKey(IntegrationProfile, on_delete=models.CASCADE, related_name='source_templates')
    target = models.ForeignKey(IntegrationProfile, on_delete=models.CASCADE, related_name='target_templates')
    description = models.TextField(blank=True)
    active_version = models.ForeignKey('MappingVersion', on_delete=models.SET_NULL, null=True, blank=True, related_name='active_for_template')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class MappingVersion(models.Model):
    template = models.ForeignKey(MappingTemplate, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    rules = models.JSONField(default=list) # List of rules frozen at this version: [{ "source": "path", "target": "field", "transform": "func" }]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('template', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.template.name} - v{self.version_number}"

class ExecutionLog(models.Model):
    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('ERROR', 'Error'),
    ]

    template = models.ForeignKey(MappingTemplate, on_delete=models.SET_NULL, null=True)
    version = models.ForeignKey(MappingVersion, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    input_data = models.JSONField(blank=True, null=True)
    output_data = models.JSONField(blank=True, null=True)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.timestamp} - {self.status}"
