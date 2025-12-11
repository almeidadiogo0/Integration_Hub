from django.core.management.base import BaseCommand
from core_hub.models import IntegrationProfile
import json
import os

class Command(BaseCommand):
    help = 'Syncs Integration Profiles from manifest.json'

    def handle(self, *args, **options):
        manifest_path = os.path.join(os.getcwd(), 'manifest.json')
        
        if not os.path.exists(manifest_path):
            self.stdout.write(self.style.ERROR('manifest.json not found in backend root'))
            return

        with open(manifest_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        adapters = data.get('adapters', [])
        self.stdout.write(f"Found {len(adapters)} adapters in manifest. Syncing...")

        # Track usage to delete orphans
        manifest_names = []

        for adapter in adapters:
            name = adapter.get('name')
            manifest_names.append(name)
            
            # Map JSON structure to Model
            update_values = {
                'type': adapter.get('type', 'SOURCE'),
                'api_url': adapter.get('api_url'),
                'auth_config': adapter.get('auth', {}),
                'schema': adapter.get('schema', {})
            }

            # Update or Create
            # Note: Ideally we should use a unique slug/id from manifest, 
            # but for now we match on Name to avoid schema changes.
            obj, created = IntegrationProfile.objects.update_or_create(
                name=name,
                defaults=update_values
            )
            
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action}: {name}"))

        # Delete orphans (Profiles in DB not in manifest)
        deleted_count, _ = IntegrationProfile.objects.exclude(name__in=manifest_names).delete()
        if deleted_count > 0:
            self.stdout.write(self.style.WARNING(f"Deleted {deleted_count} orphaned profiles not in manifest"))

        self.stdout.write(self.style.SUCCESS(f"Successfully synced {len(adapters)} profiles"))
