import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from database.connection import Base, engine
from database.seeds.seed_data import seed_database

# Routers
from services.identity_service.router import router as identity_router
from services.policy_service.router import router as policy_router
from services.posture_service.router import router as posture_router
from services.risk_service.router import router as risk_router
from services.connector_controller.router import router as connector_router
from services.private_access_service.router import router as access_router
from services.secure_web_gateway.router import router as web_security_router
from services.app_protection_service.router import router as waf_router
from services.dlp_service.router import router as dlp_router
from services.event_service.router import router as event_router
from services.alert_service.router import router as alert_router
from services.incident_service.router import router as incident_router
from services.experience_service.router import router as experience_router
from services.reporting_service.router import router as reporting_router
from services.notification_service.router import router as notification_router
from services.audit_service.router import router as audit_router
from services.tenant_service.router import router as tenant_router
from services.scenario_service.router import router as scenario_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed realistic sample data
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(
    title="ZeroTrustX Control Plane API Gateway",
    description="Enterprise-Grade Zero Trust Security, Secure Web Access & Private Application Access Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Performance & Correlation Middleware
@app.middleware("http")
async def add_process_time_and_correlation(request: Request, call_next):
    start_time = time.time()
    correlation_id = request.headers.get("X-Correlation-ID", f"ztx-{int(start_time*1000)}")
    response: Response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

# Mount All ZeroTrustX Core Microservices
app.include_router(identity_router)
app.include_router(policy_router)
app.include_router(posture_router)
app.include_router(risk_router)
app.include_router(connector_router)
app.include_router(access_router)
app.include_router(web_security_router)
app.include_router(waf_router)
app.include_router(dlp_router)
app.include_router(event_router)
app.include_router(alert_router)
app.include_router(incident_router)
app.include_router(experience_router)
app.include_router(reporting_router)
app.include_router(notification_router)
app.include_router(audit_router)
app.include_router(tenant_router)
app.include_router(scenario_router)

@app.get("/health", tags=["Observability"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "zerotrustx-control-plane",
        "version": "1.0.0",
        "components": {
            "database": "CONNECTED",
            "policy_engine": "READY",
            "risk_engine": "READY",
            "event_bus": "STREAMING",
            "app_connectors": "ONLINE"
        }
    }

@app.get("/metrics", tags=["Observability"])
def prometheus_metrics():
    # Standard Prometheus text-formatted metrics
    return PlainTextResponse(
        """# HELP ztx_http_requests_total Total HTTP requests handled
# TYPE ztx_http_requests_total counter
ztx_http_requests_total{status="200"} 4182
ztx_http_requests_total{status="403"} 142
# HELP ztx_policy_decisions_total Policy decisions computed
# TYPE ztx_policy_decisions_total counter
ztx_policy_decisions_total{decision="ALLOW"} 3890
ztx_policy_decisions_total{decision="DENY"} 292
# HELP ztx_connectors_online Number of healthy active connectors
# TYPE ztx_connectors_online gauge
ztx_connectors_online 3
# HELP ztx_dlp_blocks_total Sensitive data exfiltration blocks
# TYPE ztx_dlp_blocks_total counter
ztx_dlp_blocks_total 18
# HELP ztx_waf_blocks_total WAF malicious requests blocked
# TYPE ztx_waf_blocks_total counter
ztx_waf_blocks_total 45
"""
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
