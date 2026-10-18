from typing import Dict, Any, List, Tuple

class PolicyEvaluationResult:
    def __init__(
        self,
        decision: str,
        matched_policy_id: str,
        matched_policy_name: str,
        matched_conditions: List[str],
        reason: str,
        risk_score: int,
        evaluation_trace: List[Dict[str, Any]]
    ):
        self.decision = decision
        self.matched_policy_id = matched_policy_id
        self.matched_policy_name = matched_policy_name
        self.matched_conditions = matched_conditions
        self.reason = reason
        self.risk_score = risk_score
        self.evaluation_trace = evaluation_trace

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision": self.decision,
            "matched_policy_id": self.matched_policy_id,
            "matched_policy_name": self.matched_policy_name,
            "matched_conditions": self.matched_conditions,
            "reason": self.reason,
            "risk_score": self.risk_score,
            "evaluation_trace": self.evaluation_trace
        }

def match_condition_block(criteria: Dict[str, Any], context: Dict[str, Any]) -> Tuple[bool, List[str]]:
    matched_reasons = []

    # Risk checks
    if "risk" in criteria:
        risk_crit = criteria["risk"]
        ctx_risk = context.get("risk", {}).get("score", 0)
        if "maximum" in risk_crit:
            if ctx_risk > risk_crit["maximum"]:
                return False, []
            matched_reasons.append(f"risk.score({ctx_risk}) <= max({risk_crit['maximum']})")
        if "minimum" in risk_crit:
            if ctx_risk < risk_crit["minimum"]:
                return False, []
            matched_reasons.append(f"risk.score({ctx_risk}) >= min({risk_crit['minimum']})")

    # User checks
    if "user" in criteria:
        u_crit = criteria["user"]
        ctx_user = context.get("user", {})
        if "role" in u_crit:
            if ctx_user.get("role") != u_crit["role"]:
                return False, []
            matched_reasons.append(f"user.role == {u_crit['role']}")
        if "department" in u_crit:
            if ctx_user.get("department") != u_crit["department"]:
                return False, []
            matched_reasons.append(f"user.department == {u_crit['department']}")

    # Device checks
    if "device" in criteria:
        d_crit = criteria["device"]
        ctx_dev = context.get("device", {})
        if "managed" in d_crit:
            if ctx_dev.get("managed") != d_crit["managed"]:
                return False, []
            matched_reasons.append(f"device.managed == {d_crit['managed']}")
        if "firewall_enabled" in d_crit:
            if ctx_dev.get("firewall_enabled") != d_crit["firewall_enabled"]:
                return False, []
            matched_reasons.append(f"device.firewall == {d_crit['firewall_enabled']}")
        if "antivirus_enabled" in d_crit:
            if ctx_dev.get("antivirus_enabled") != d_crit["antivirus_enabled"]:
                return False, []
            matched_reasons.append(f"device.antivirus == {d_crit['antivirus_enabled']}")
        if "encrypted" in d_crit:
            if ctx_dev.get("disk_encrypted", ctx_dev.get("encrypted")) != d_crit["encrypted"]:
                return False, []
            matched_reasons.append(f"device.encrypted == {d_crit['encrypted']}")
        if "compliance_status" in d_crit:
            if ctx_dev.get("compliance_status") != d_crit["compliance_status"]:
                return False, []
            matched_reasons.append(f"device.compliance_status == {d_crit['compliance_status']}")

    # Application checks
    if "application" in criteria:
        a_crit = criteria["application"]
        ctx_app = context.get("application", {})
        if "domain" in a_crit:
            if ctx_app.get("domain") != a_crit["domain"]:
                return False, []
            matched_reasons.append(f"application.domain == {a_crit['domain']}")
        if "name" in a_crit:
            if ctx_app.get("name") != a_crit["name"]:
                return False, []
            matched_reasons.append(f"application.name == {a_crit['name']}")

    return True, matched_reasons

def evaluate_policies(policies: List[Any], context: Dict[str, Any]) -> PolicyEvaluationResult:
    # Sort policies strictly by ascending priority
    sorted_policies = sorted(policies, key=lambda p: getattr(p, "priority", 1000))
    evaluation_trace = []
    risk_score = context.get("risk", {}).get("score", 0)

    # First-match evaluation algorithm with explicit conditions
    for pol in sorted_policies:
        # Check active status
        if getattr(pol, "status", "ACTIVE") not in ["ACTIVE", "TESTING"]:
            continue

        conditions = getattr(pol, "conditions", {}) or {}
        is_match, reasons = match_condition_block(conditions, context)

        trace_entry = {
            "policy_id": pol.id,
            "policy_name": pol.name,
            "priority": pol.priority,
            "action": pol.action,
            "matched": is_match,
            "conditions_tested": conditions,
            "matched_reasons": reasons
        }
        evaluation_trace.append(trace_entry)

        if is_match:
            action = getattr(pol, "action", "ALLOW")
            reason_str = "; ".join(reasons) if reasons else "Policy criteria matched"
            return PolicyEvaluationResult(
                decision=action,
                matched_policy_id=pol.id,
                matched_policy_name=pol.name,
                matched_conditions=reasons,
                reason=reason_str,
                risk_score=risk_score,
                evaluation_trace=evaluation_trace
            )

    # Implicit Default Deny
    return PolicyEvaluationResult(
        decision="DENY",
        matched_policy_id="default-deny",
        matched_policy_name="Implicit Default Zero Trust Deny",
        matched_conditions=["No policy rule matched"],
        reason="Zero Trust principle: access denied by default when no explicit rule permits",
        risk_score=risk_score,
        evaluation_trace=evaluation_trace
    )
