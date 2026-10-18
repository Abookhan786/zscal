from fastapi import FastAPI
import uvicorn

app = FastAPI(title="ZeroTrustX Mock Private Applications")

@app.get("/git")
def git_server():
    return {
        "service": "Git Server (developer-portal)",
        "status": "ONLINE",
        "repositories": ["zerotrustx/core", "infra/k8s", "soc/signatures"],
        "message": "Secure connection established via ZeroTrustX App Connector tunnel."
    }

@app.get("/finance")
def finance_portal():
    return {
        "service": "Finance Portal",
        "status": "ONLINE",
        "accounts": ["Treasury-USD", "Payroll-General", "Audit-Holdings"],
        "message": "Confidential financial ledger accessed via authorized connector broker."
    }

@app.get("/hr")
def hr_portal():
    return {
        "service": "HR Portal",
        "status": "ONLINE",
        "headcount": 1420,
        "directory": "Active"
    }

@app.get("/admin")
def admin_portal():
    return {
        "service": "Internal Cluster Admin API",
        "status": "ONLINE",
        "cluster_nodes": 12,
        "control_plane": "Operational"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=9000)
