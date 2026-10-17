"""
Minimal proxy-style API-key gate (owner-requested "basic one") for the MCP
surface and the API, so the backend can sit behind mate's deployment without
open access.

- Key source: backend/.api_key (gitignored, chmod 600, owner-minted via
  `openssl rand -hex 24`). If the file is absent OR AUTH_DISABLED=1 is set,
  the gate is OFF — local dev and pytest run unauthenticated.
- Accepted credentials: `X-API-Key: <key>` or `Authorization: Bearer <key>`.
- Exemptions (documented, deliberate):
    /docs, /redoc, /openapi.json — read-only docs
    /api/health                  — liveness for orchestrators
    OPTIONS preflights           — CORS handshake
    requests WITH an Origin/Sec-Fetch-Site header — same-origin browser (the
      Next.js UI panel). This is a DEMO-level exemption: a non-browser client
      can forge it, so treat it as convenience, not security.
"""
import os
from pathlib import Path
from typing import Optional, Tuple

_KEY_FILE = Path(__file__).resolve().parents[2] / ".api_key"  # backend/.api_key

_OPEN_PATHS = ("/docs", "/redoc", "/openapi.json", "/api/health")


def auth_enabled() -> bool:
    """Gate is ON only when AUTH_DISABLED is unset/0 and the key file exists."""
    if os.environ.get("AUTH_DISABLED", "0").strip() == "1":
        return False
    return _KEY_FILE.is_file()


def load_api_key() -> Optional[str]:
    if not auth_enabled():
        return None
    return _KEY_FILE.read_text(encoding="utf-8").strip()


def gate_request(path: str, method: str,
                 x_api_key: Optional[str], authorization: Optional[str],
                 has_browser_origin: bool, key: Optional[str]) -> Tuple[bool, str]:
    """
    Pure decision function. Returns (allowed, reason). `key` is the expected
    key (None = gate off). Real request handling in main.py wires this up.
    """
    if key is None:
        return True, "gate-off"
    if method == "OPTIONS":
        return True, "preflight"
    if path.startswith(_OPEN_PATHS):
        return True, "open-path"
    if has_browser_origin:
        return True, "same-origin-browser"
    candidate = x_api_key or (authorization[7:] if authorization and authorization.startswith("Bearer ") else None)
    if candidate and candidate.strip() == key:
        return True, "key-ok"
    return False, "unauthorized"


async def auth_middleware(request, call_next):
    """ASGI middleware — matches Starlette @app.middleware signature."""
    if not auth_enabled():
        return await call_next(request)
    key = load_api_key()
    allowed, reason = gate_request(
        request.url.path, request.method,
        request.headers.get("X-API-Key"), request.headers.get("Authorization"),
        bool(request.headers.get("Origin") or request.headers.get("Sec-Fetch-Site")),
        key,
    )
    if allowed:
        return await call_next(request)
    from fastapi.responses import JSONResponse
    return JSONResponse({"detail": "Unauthorized — set X-API-Key header"}, status_code=401)
