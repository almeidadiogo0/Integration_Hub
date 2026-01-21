import httpx
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
        """
        if value and isinstance(value, str) and value.startswith('env:'):
            env_var = value.split(':', 1)[1]
            import os
            return os.getenv(env_var, '') 
        return value

    @staticmethod
    async def fetch_data(profile, params=None):
        """
        Fetches data from the profile's api_url ASYNC.
        """
        if not profile.api_url:
            raise ValueError("Source Profile has no API URL configured.")

        url = profile.api_url
        headers = {}
        
        # auth_config handling
        auth = profile.auth_config
        if auth:
            if auth.get('type') == 'Bearer':
                token = DataFetcher._resolve_secret(auth.get('token'))
                headers['Authorization'] = f"Bearer {token}"
            elif auth.get('type') == 'Basic':
                pass 
            elif auth.get('type') == 'ApiKey':
                key_name = auth.get('key_name', 'X-API-Key')
                key_value = DataFetcher._resolve_secret(auth.get('value'))
                headers[key_name] = key_value

        # Parameter substitution
        if params:
            try:
                url = url.format(**params)
            except KeyError as e:
                raise ValueError(f"Missing required URL parameter: {e}")

        logger.info(f"Fetching data (ASYNC) from {url} with params {params}")
        
        try:
            async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                return response.json()
        except httpx.RequestError as e:
             raise ValueError(f"Failed to fetch data: {str(e)}")
        except httpx.HTTPStatusError as e:
             raise ValueError(f"Upstream API Error: {e.response.status_code} - {e.response.text}")

class DataSender:
    """
    Handles sending data to external APIs (Target).
    """
    @staticmethod
    async def send_data(profile, data):
        if not profile.api_url:
            return None 

        url = profile.api_url
        headers = {'Content-Type': 'application/json'}
        
        auth = profile.auth_config
        if auth:
            if auth.get('type') == 'Bearer':
                token = DataFetcher._resolve_secret(auth.get('token'))
                headers['Authorization'] = f"Bearer {token}"
            elif auth.get('type') == 'ApiKey':
                key_name = auth.get('key_name', 'X-API-Key')
                key_value = DataFetcher._resolve_secret(auth.get('value'))
                headers[key_name] = key_value

        logger.info(f"Sending data (ASYNC) to {url}")
        
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.post(url, json=data, headers=headers)
                response.raise_for_status()
                try:
                    return response.json()
                except ValueError:
                    return {"status": response.status_code, "text": response.text}
        except httpx.RequestError as e:
             raise ValueError(f"Failed to send data: {str(e)}")
        except httpx.HTTPStatusError as e:
             raise ValueError(f"Upstream Target Error: {e.response.status_code} - {e.response.text}")
