import pytest
from services.policy_service.evaluator import evaluate_policies

class MockPolicy:
    def __init__(self, id, name, priority, action, conditions, status="ACTIVE"):
        self.id = id
        self.name = name
        self.priority = priority
        self.action = action
        self.conditions = conditions
        self.status = status

def test_developer_git_access_allowed():
    policies = [
        MockPolicy(
            id="p1",
            name="Developer Git Access",
            priority=100,
            action="ALLOW",
            conditions={
                "user": {"role": "developer"},
                "device": {"managed": True, "firewall_enabled": True},
                "application": {"name": "Git Server"},
                "risk": {"maximum": 50}
            }
        ),
        MockPolicy(
            id="p99",
            name="Default Deny",
            priority=999,
            action="DENY",
            conditions={}
        )
    ]

    context = {
        "user": {"role": "developer", "department": "Engineering"},
        "device": {"managed": True, "firewall_enabled": True, "antivirus_enabled": True},
        "application": {"name": "Git Server", "domain": "git.internal"},
        "risk": {"score": 15}
    }

    result = evaluate_policies(policies, context)
    assert result.decision == "ALLOW"
    assert result.matched_policy_id == "p1"

def test_finance_access_denied_for_developer():
    policies = [
        MockPolicy(
            id="p1",
            name="Developer Git Access",
            priority=100,
            action="ALLOW",
            conditions={
                "user": {"role": "developer"},
                "application": {"name": "Git Server"}
            }
        ),
        MockPolicy(
            id="p2",
            name="Finance Access",
            priority=110,
            action="ALLOW",
            conditions={
                "user": {"role": "finance"},
                "application": {"name": "Finance Portal"}
            }
        ),
        MockPolicy(
            id="p99",
            name="Default Deny",
            priority=999,
            action="DENY",
            conditions={}
        )
    ]

    context = {
        "user": {"role": "developer"},
        "device": {"managed": True},
        "application": {"name": "Finance Portal"},
        "risk": {"score": 15}
    }

    result = evaluate_policies(policies, context)
    assert result.decision == "DENY"

def test_high_risk_policy_precedence():
    policies = [
        MockPolicy(
            id="p-emergency",
            name="High Risk Quarantine",
            priority=10,
            action="DENY",
            conditions={
                "risk": {"minimum": 80}
            }
        ),
        MockPolicy(
            id="p-git",
            name="Developer Git Access",
            priority=100,
            action="ALLOW",
            conditions={
                "user": {"role": "developer"},
                "application": {"name": "Git Server"}
            }
        )
    ]

    context = {
        "user": {"role": "developer"},
        "device": {"managed": True},
        "application": {"name": "Git Server"},
        "risk": {"score": 85}
    }

    result = evaluate_policies(policies, context)
    assert result.decision == "DENY"
    assert result.matched_policy_id == "p-emergency"
