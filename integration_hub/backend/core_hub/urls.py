from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    IntegrationProfileViewSet, MappingTemplateViewSet, 
    MappingVersionViewSet, ExecutionLogViewSet
)
from . import ai_views

router = DefaultRouter()
router.register(r'profiles', IntegrationProfileViewSet)
router.register(r'templates', MappingTemplateViewSet)
router.register(r'versions', MappingVersionViewSet)
router.register(r'logs', ExecutionLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ai/auto-map/', ai_views.auto_map, name='auto-map'),
]

