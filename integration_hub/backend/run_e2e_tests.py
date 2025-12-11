import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def print_result(name, success, message=""):
    symbol = "✅" if success else "❌"
    print(f"{symbol} {name}: {message}")

def run_tests():
    print("🚀 Starting End-to-End Simulation...\n")

    # 1. Create Profiles
    print("--- 1. Creating Profiles ---")
    source_payload = {
        "name": "E2E Source (Webhook)",
        "type": "SOURCE",
        "api_url": "", # Passive
        "schema": {"fields": ["id", "name", "email"]}
    }
    target_payload = {
        "name": "E2E Target (Echo)",
        "type": "TARGET",
        "api_url": "https://echo.free.beeceptor.com", # Public echo service or similar. 
        # Using a specialized detailed echo service if possible or just assuming logic holds.
        # Ideally we use a local echo if possible, but for now external is okay or we mock.
        # Let's use httpbin for reliability
        "api_url": "https://httpbin.org/post"
    }
    
    try:
        r_src = requests.post(f"{BASE_URL}/profiles/", json=source_payload)
        r_tgt = requests.post(f"{BASE_URL}/profiles/", json=target_payload)
        
        if r_src.status_code != 201 or r_tgt.status_code != 201:
            print_result("Create Profiles", False, f"Status: {r_src.status_code}, {r_tgt.status_code}")
            return
        
        src_id = r_src.json()['id']
        tgt_id = r_tgt.json()['id']
        print_result("Create Profiles", True, f"IDs: {src_id}, {tgt_id}")
    except Exception as e:
        print_result("Create Profiles", False, str(e))
        return

    # 2. Create Template
    print("\n--- 2. Creating Template ---")
    tpl_payload = {
        "name": "E2E Template",
        "source": src_id,
        "target": tgt_id,
        "description": "Created by E2E Script"
    }
    try:
        r_tpl = requests.post(f"{BASE_URL}/templates/", json=tpl_payload)
        tpl_id = r_tpl.json()['id']
        print_result("Create Template", True, f"ID: {tpl_id}")
    except Exception as e:
        print_result("Create Template", False, str(e))
        return

    # 3. Create Version with Rules
    print("\n--- 3. Creating Mapping Version ---")
    rules = [
        {"source_path": "name", "target_field": "full_name", "transform": "UPPERCASE"},
        {"source_path": "email", "target_field": "contact_email", "transform": "LOWERCASE"}
    ]
    ver_payload = {
        "template": tpl_id,
        "version_number": 1,
        "rules": rules
    }
    try:
        r_ver = requests.post(f"{BASE_URL}/versions/", json=ver_payload)
        ver_id = r_ver.json()['id']
        
        # Activate it
        requests.patch(f"{BASE_URL}/templates/{tpl_id}/", json={"active_version": ver_id})
        print_result("Create & Activate Version", True, f"Ver ID: {ver_id}")
    except Exception as e:
        print_result("Create Version", False, str(e))
        return

    # 4. Execute (Passive)
    print("\n--- 4. Executing Integration (Passive) ---")
    input_data = {
        "data": {
            "id": 123,
            "name": "John Doe",
            "email": "JOHN.DOE@EXAMPLE.COM"
        },
        "is_test": True
    }
    try:
        r_exec = requests.post(f"{BASE_URL}/templates/{tpl_id}/execute/", json=input_data)
        if r_exec.status_code == 200:
            res = r_exec.json()
            mapped = res.get('mapped_data', {})
            
            # Verify Transformations
            t1 = mapped.get('full_name') == "JOHN DOE"
            t2 = mapped.get('contact_email') == "john.doe@example.com"
            
            if t1 and t2:
                 print_result("Execution Logic", True, "Transformations Correct")
            else:
                 print_result("Execution Logic", False, f"Got: {mapped}")
                 
            # Verify is_test response if we decided to return it? 
            # We didn't change response schema to Include is_test, only ExecutionLog.
            
        else:
            print_result("Execution Request", False, f"Status {r_exec.status_code}: {r_exec.text}")
    except Exception as e:
        print_result("Execute Passive", False, str(e))

    # 5. Verify Logs
    print("\n--- 5. Verifying Logs ---")
    try:
        r_logs = requests.get(f"{BASE_URL}/logs/")
        logs = r_logs.json()
        
        # Find our log
        my_log = next((l for l in logs if l['template'] == tpl_id), None)
        
        if my_log:
            check_test = my_log.get('is_test') is True
            print_result("Log Created", True)
            print_result("is_test Flag Persisted", check_test, f"Value: {my_log.get('is_test')}")
        else:
            print_result("Log Created", False, "Log not found for template")
            
    except Exception as e:
        print_result("Verify Logs", False, str(e))

if __name__ == "__main__":
    run_tests()
