"""
Tests for the API-key gate (backend/app/core/auth.py) — pure decision logic,
no mocks: real temp key files, real header values.
"""
import os

from app.core.auth import auth_enabled, gate_request


def test_gate_open_when_no_key(monkeypatch, tmp_path):
    """Absent key file / AUTH_DISABLED=1 → gate off, everything allowed."""
    monkeypatch.setenv("AUTH_DISABLED", "1")
    assert auth_enabled() is False
    allowed, _ = gate_request("/mcp", "POST", None, None, False, None)
    assert allowed is True


def test_gate_accepts_x_api_key(monkeypatch, tmp_path):
    key_file = tmp_path / ".api_key"
    key_file.write_text("secret123")
    monkeypatch.setenv("AUTH_DISABLED", "0")
    import app.core.auth as a
    monkeypatch.setattr(a, "_KEY_FILE", key_file)
    monkeypatch.delenv("AUTH_DISABLED", raising=False)
    assert auth_enabled() is True

    allowed, reason = gate_request("/mcp", "POST", "secret123", None, False, "secret123")
    assert allowed and reason == "key-ok"
    # Bearer scheme also accepted
    allowed, _ = gate_request("/mcp", "POST", None, "Bearer secret123", False, "secret123")
    assert allowed is True


def test_gate_rejects_missing_or_wrong_key(monkeypatch, tmp_path):
    key_file = tmp_path / ".api_key"
    key_file.write_text("secret123")
    import app.core.auth as a
    monkeypatch.setattr(a, "_KEY_FILE", key_file)
    monkeypatch.delenv("AUTH_DISABLED", raising=False)

    allowed, reason = gate_request("/mcp", "POST", None, None, False, "secret123")
    assert not allowed and reason == "unauthorized"
    allowed, _ = gate_request("/mcp", "POST", "wrong", None, False, "secret123")
    assert not allowed


def test_gate_exemptions(monkeypatch, tmp_path):
    key_file = tmp_path / ".api_key"
    key_file.write_text("secret123")
    import app.core.auth as a
    monkeypatch.setattr(a, "_KEY_FILE", key_file)
    monkeypatch.delenv("AUTH_DISABLED", raising=False)
    key = "secret123"

    # health, docs, preflight, same-origin browser are deliberate exemptions
    for path, method in [("/api/health", "GET"), ("/docs", "GET"), ("/mcp", "OPTIONS")]:
        allowed, reason = gate_request(path, method, None, None, False, key)
        assert allowed, f"{path} {method} must be exempt"
    allowed, reason = gate_request("/api/graph/impact/sys_auth", "GET", None, None, True, key)
    assert allowed and reason == "same-origin-browser"
