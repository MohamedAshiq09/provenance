"""
Shared test fixtures.

AUTH_DISABLED=1: repo holds a real backend/.api_key (gitignored, owner-minted).
The in-process TestClient sends no Origin/API-key headers, so the gate would
otherwise 401 every API test. Tests verify the gate itself in test_auth.py
(with monkeypatched temp key files); everything else runs key-off.
"""
import os

import pytest


@pytest.fixture(autouse=True)
def _auth_off(monkeypatch):
    monkeypatch.setenv("AUTH_DISABLED", "1")
    yield
