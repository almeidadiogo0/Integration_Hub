import requests
import json
import logging

logger = logging.getLogger(__name__)

class DataFetcher:
    """
    Handles fetching data from external APIs (Source).
    """

    @staticmethod
    def _resolve_secret(value):
        """
        Resolves a secret value. 
        If value starts with 'env:', reads from os.environ.
        Otherwise triggers a ValueError if implied it should be secret but isnt? 
        No, simpler: just return value if no prefix, but support env: prefix.
        """
        if value and isinstance(value, str) and value.startswith('env:'):
            env_var = value.split(':', 1)[1]
            import os
            return os.getenv(env_var, '') 
        return value

    @staticmethod
    def fetch_data(profile, params=None):
        """
        Fetches data from the profile's api_url.
        Supports query parameter substitution with {key} syntax in URL.
        """
        if not profile.api_url:
            raise ValueError("Source Profile has no API URL configured.")

        url = profile.api_url
        headers = {}
        
        # auth_config handling (basic implementation)
        auth = profile.auth_config
        if auth:
            if auth.get('type') == 'Bearer':
                token = DataFetcher._resolve_secret(auth.get('token'))
                headers['Authorization'] = f"Bearer {token}"
            elif auth.get('type') == 'Basic':
                # Assuming requests can handle tuple, but explicit auth is better if stored fully
                pass # Implementation depends on how we store user/pass
            elif auth.get('type') == 'ApiKey':
                key_name = auth.get('key_name', 'X-API-Key')
                key_value = DataFetcher._resolve_secret(auth.get('value'))
                headers[key_name] = key_value

        # Parameter substitution in URL (e.g. /cnpj/{cnpj})
        if params:
            try:
                # Use str.format to replace placeholders
                url = url.format(**params)
            except KeyError as e:
                raise ValueError(f"Missing required URL parameter: {e}")

        logger.info(f"Fetching data from {url} with params {params}")
        
        try:
            # Added verify=False to avoid SSL issues in local dev environments provided by user
            response = requests.get(url, headers=headers, verify=False)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to fetch data: {str(e)}")

class DataSender:
    """
    Handles sending data to external APIs (Target).
    """
    @staticmethod
    def send_data(profile, data):
        if not profile.api_url:
            return None # No target URL configured, we just return safely

        url = profile.api_url
        headers = {'Content-Type': 'application/json'}
        
        # auth_config handling
        auth = profile.auth_config
        if auth:
            if auth.get('type') == 'Bearer':
                token = DataFetcher._resolve_secret(auth.get('token'))
                headers['Authorization'] = f"Bearer {token}"
            elif auth.get('type') == 'ApiKey':
                key_name = auth.get('key_name', 'X-API-Key')
                key_value = DataFetcher._resolve_secret(auth.get('value'))
                headers[key_name] = key_value

        logger.info(f"Sending data to {url}")
        
        try:
            response = requests.post(url, json=data, headers=headers, verify=False)
            response.raise_for_status()
            try:
                return response.json()
            except ValueError:
                return {"status": response.status_code, "text": response.text}
        except requests.exceptions.RequestException as e:
             # Depending on requirements, we might raise or just return error dict
             raise ValueError(f"Failed to send data: {str(e)}")
