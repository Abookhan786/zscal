import os
import sys
import platform
import socket
import time
import requests
import json

CONTROL_PLANE_URL = os.getenv("CONTROL_PLANE_URL", "http://localhost:8000")
DEVICE_NAME = os.getenv("DEVICE_NAME", f"{socket.gethostname()}-Agent")

class EndpointAgent:
    def __init__(self, api_url=CONTROL_PLANE_URL):
        self.api_url = api_url.rstrip("/")
        self.hostname = socket.gethostname()
        self.os = platform.system()
        self.os_version = platform.release()
        self.device_id = None
        self.firewall_enabled = True
        self.antivirus_enabled = True
        self.disk_encrypted = True
        self.is_managed = True
        self.session_token = None

    def register_device(self, user_id=None):
        payload = {
            "device_name": DEVICE_NAME,
            "hostname": self.hostname,
            "os": self.os,
            "os_version": self.os_version,
            "agent_version": "1.2.0",
            "is_managed": self.is_managed,
            "tenant_id": "tenant-enterprise-01",
            "user_id": user_id
        }
        try:
            res = requests.post(f"{self.api_url}/api/v1/posture/register", json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                self.device_id = data["id"]
                print(f"[EndpointAgent] Device successfully registered! ID: {self.device_id}")
                return self.device_id
            else:
                print(f"[EndpointAgent] Registration error: {res.text}")
        except Exception as e:
            print(f"[EndpointAgent] Unable to reach control plane: {e}")
        return None

    def send_posture_report(self):
        if not self.device_id:
            print("[EndpointAgent] Cannot report posture without device_id.")
            return None

        payload = {
            "device_id": self.device_id,
            "tenant_id": "tenant-enterprise-01",
            "firewall_enabled": self.firewall_enabled,
            "antivirus_enabled": self.antivirus_enabled,
            "disk_encrypted": self.disk_encrypted,
            "screen_lock_enabled": True,
            "patches_up_to_date": True,
            "certificate_valid": True,
            "reported_ip": socket.gethostbyname(self.hostname) if hasattr(socket, "gethostbyname") else "10.100.4.12"
        }
        try:
            res = requests.post(f"{self.api_url}/api/v1/posture/report", json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                print(f"[EndpointAgent] Posture reported. Compliance: {data.get('compliance_status')}, Risk: {data.get('device_risk_score')}")
                return data
        except Exception as e:
            print(f"[EndpointAgent] Posture update failed: {e}")
        return None

    def request_private_app_access(self, username="alice", application_domain="git.internal"):
        payload = {
            "username": username,
            "device_id": self.device_id or "dev-alice-laptop",
            "application_domain": application_domain
        }
        try:
            res = requests.post(f"{self.api_url}/api/v1/access/request", json=payload, timeout=5)
            print(f"[EndpointAgent] Access request to {application_domain}: {res.status_code} - {res.json()}")
            return res.json()
        except Exception as e:
            print(f"[EndpointAgent] Access request failed: {e}")
            return None

    def simulate_compromise(self):
        print("[EndpointAgent] SIMULATING COMPROMISE: Disabling local firewall and AV...")
        self.firewall_enabled = False
        self.antivirus_enabled = False
        return self.send_posture_report()

    def restore_posture(self):
        print("[EndpointAgent] Restoring compliant security posture...")
        self.firewall_enabled = True
        self.antivirus_enabled = True
        self.disk_encrypted = True
        return self.send_posture_report()

if __name__ == "__main__":
    agent = EndpointAgent()
    print("[EndpointAgent] Starting ZeroTrustX Endpoint Security Agent...")
    dev_id = agent.register_device()
    if dev_id:
        agent.send_posture_report()
        print("[EndpointAgent] Testing private app routing to git.internal...")
        agent.request_private_app_access()
