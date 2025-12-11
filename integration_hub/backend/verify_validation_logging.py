import requests
import sys

BASE_URL = "http://localhost:8000/api"

def run():
    print("🚀 Verifying Validation Error Logging...\n")

    # 1. Create a Passive Template (requires input data)
    print("1. Creating Template...")
    # Use existing profiles if possible or create new ones? 
    # Let's create typically to be safe.
    try:
        src = requests.post(f"{BASE_URL}/profiles/", json={"name": "ValTest Source", "type": "SOURCE", "api_url": ""}).json()
        tgt = requests.post(f"{BASE_URL}/profiles/", json={"name": "ValTest Target", "type": "TARGET", "api_url": "https://httpbin.org/post"}).json()
        tpl = requests.post(f"{BASE_URL}/templates/", json={"name": "Validation Test Tpl", "source": src['id'], "target": tgt['id']}).json()
        
        # Need active version to reach execution logic? 
        # Actually validation logic checks for active version. If missing, it raises ValueError.
        # Perfect test case: Execute WITHOUT active version.
        
        tpl_id = tpl['id']
        print(f"   Template ID: {tpl_id}")
    except Exception as e:
        print(f"Setup Failed: {e}")
        return

    # 2. Trigger Failure: No Active Version or Missing Input
    print("\n2. Triggering 'Bad Request' (Missing Input)...")
    # Even if we send data, if no version, it fails.
    # Let's try sending NO data to a passive source.
    try:
        r = requests.post(f"{BASE_URL}/templates/{tpl_id}/execute/", json={"is_test": True})
        print(f"   Response Code: {r.status_code}")
        print(f"   Response Body: {r.text}")
        
        if r.status_code == 400:
            print("   ✅ Startus Code is 400 (Expected)")
        else:
             print("   ❌ Unexpected Status Code")
             
    except Exception as e:
        print(f"Trigger Failed: {e}")

    # 3. Verify Log Exists
    print("\n3. Verifying Log Presence...")
    try:
        r_logs = requests.get(f"{BASE_URL}/logs/")
        logs = r_logs.json()
        # Look for our log
        # We need to find a log for this template with status ERROR and is_test=True
        
        found = False
        for log in logs:
            if log['template'] == tpl_id and log['status'] == 'ERROR':
                print(f"   ✅ Found Log: ID {log['id']} - {log['error_message']}")
                found = True
                break
        
        if not found:
            print("   ❌ Log NOT found in database!")
        
    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    run()
