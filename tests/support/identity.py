"""A stand-in for the web app's identity service.

Signs real RS256 tokens, serves them a JWKS, and exchanges API keys, so the
auth plugins are tested against the same cryptography they meet in production.
"""

from __future__ import annotations

import time
import uuid
from functools import cache
from typing import Any

import httpx
import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm

from ldk_core.auth import SCOPES_BY_ROLE, Authenticator
from ldk_plugin_auth import LocalAuthProvider

ISSUER = "llm-dev-kit-web"
AUDIENCE = "llm-dev-kit"
JWKS_URL = "http://web.test/.well-known/jwks.json"
TOKEN_URL = "http://web.test/api/identity/token"


@cache
def rsa_key(kid: str) -> rsa.RSAPrivateKey:
    """One key per id for the whole test run; generating RSA keys is slow."""
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def public_jwk(kid: str) -> dict[str, Any]:
    jwk = RSAAlgorithm.to_jwk(rsa_key(kid).public_key(), as_dict=True)
    return {**jwk, "kid": kid, "alg": "RS256", "use": "sig"}


def sign(claims: dict[str, Any], kid: str, algorithm: str = "RS256") -> str:
    return jwt.encode(claims, rsa_key(kid), algorithm=algorithm, headers={"kid": kid})


class Issuer:
    """Tokens, a JWKS endpoint and an API-key exchange endpoint.

    Attributes:
        kids: Key ids currently published, newest last.
        api_keys: Valid API keys and the role each belongs to.
        jwks_fetches: How many times the JWKS was served.
        exchanges: How many API-key exchanges were answered.
        down: When true, every request fails to connect.
    """

    def __init__(self) -> None:
        self.kids = ["key-1"]
        self.api_keys: dict[str, str] = {}
        self.jwks_fetches = 0
        self.exchanges = 0
        self.down = False

    def token(
        self,
        role: str = "user",
        *,
        sub: str = "user-1",
        scope: str | None = None,
        expires_in: int = 300,
        issuer: str = ISSUER,
        audience: str = AUDIENCE,
        amr: list[str] | None = None,
        kid: str | None = None,
    ) -> str:
        now = int(time.time())
        claims: dict[str, Any] = {
            "iss": issuer,
            "aud": audience,
            "sub": sub,
            "iat": now,
            "exp": now + expires_in,
            "jti": uuid.uuid4().hex,
            "roles": [role],
            "scope": scope if scope is not None else " ".join(sorted(SCOPES_BY_ROLE[role])),
        }
        if amr is not None:
            claims["amr"] = amr
        return sign(claims, kid or self.kids[-1])

    def rotate(self, kid: str) -> None:
        self.kids.append(kid)

    def handle(self, request: httpx.Request) -> httpx.Response:
        if self.down:
            raise httpx.ConnectError("connection refused", request=request)
        if request.url == httpx.URL(JWKS_URL):
            self.jwks_fetches += 1
            return httpx.Response(200, json={"keys": [public_jwk(k) for k in self.kids]})
        if request.url == httpx.URL(TOKEN_URL) and request.method == "POST":
            key = request.headers.get("authorization", "").removeprefix("Bearer ")
            role = self.api_keys.get(key)
            if role is None:
                return httpx.Response(401, json={"error": {"code": "unauthorized"}})
            self.exchanges += 1
            token = self.token(role, sub=f"owner-of-{key[-4:]}", amr=["api_key"])
            return httpx.Response(
                200, json={"access_token": token, "token_type": "Bearer", "expires_in": 300}
            )
        return httpx.Response(404)

    def transport(self) -> httpx.MockTransport:
        return httpx.MockTransport(self.handle)

    def provider(self) -> LocalAuthProvider:
        return LocalAuthProvider(
            jwks_url=JWKS_URL,
            token_url=TOKEN_URL,
            issuer=ISSUER,
            audience=AUDIENCE,
            transport=self.transport(),
        )

    def authenticator(self, *, allow_anonymous: bool = False) -> Authenticator:
        return Authenticator([self.provider()], allow_anonymous=allow_anonymous)

    def bearer(self, role: str = "user", **kwargs: Any) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token(role, **kwargs)}"}
