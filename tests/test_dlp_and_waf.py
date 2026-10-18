import pytest
from services.dlp_service.router import scan_text_for_dlp, luhn_checksum
from services.app_protection_service.router import scan_waf_payload

def test_luhn_algorithm():
    assert luhn_checksum("4532019288411027") is True
    assert luhn_checksum("1234567812345671") is False

def test_dlp_detects_credit_card():
    text = "Please process billing for card 4532-0192-8841-1027 immediately."
    res = scan_text_for_dlp(text)
    assert res["has_violations"] is True
    assert any(f["type"] == "CREDIT_CARD" for f in res["findings"])
    assert "4532-XXXX-XXXX-1027" in res["redacted_text"]

def test_dlp_detects_aws_credentials():
    text = "export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE"
    res = scan_text_for_dlp(text)
    assert res["has_violations"] is True
    assert any(f["type"] == "AWS_API_KEY" for f in res["findings"])

def test_waf_detects_sqli():
    payload = "admin' OR '1'='1"
    res = scan_waf_payload(payload)
    assert res is not None
    assert res["attack_type"] == "SQL_INJECTION"

def test_waf_detects_xss():
    payload = "<script>alert(document.cookie)</script>"
    res = scan_waf_payload(payload)
    assert res is not None
    assert res["attack_type"] == "CROSS_SITE_SCRIPTING"

def test_waf_detects_path_traversal():
    payload = "/v1/download?file=../../../../etc/passwd"
    res = scan_waf_payload(payload)
    assert res is not None
    assert res["attack_type"] == "PATH_TRAVERSAL"
