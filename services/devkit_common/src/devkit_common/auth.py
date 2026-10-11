"""Authentication for the FastAPI services.

``build_authenticator`` configures the auth plugins from settings at startup;
``require(scope)`` is the dependency every protected route declares::

    @app.post("/ingest/pdf")
    async def ingest(..., principal: Principal = Depends(require(INGEST))): ...

A route without it is public, which only ``/health`` should be.
"""

from collections.abc import Awaitable, Callable

from fastapi import Request

from devkit_common.config import Settings
from ldk_core.auth import Authenticator, bind_credential, require_scope
from ldk_core.plugins import AUTH, PluginKind, PluginRegistry
from ldk_core.ports import AuthProvider, Principal


def build_authenticator(registry: PluginRegistry, settings: Settings) -> Authenticator:
    """Configure ``auth.local`` (and ``auth.oidc`` when an issuer is set)."""
    registry.configure(
        PluginKind.AUTH,
        "local",
        {
            "jwks_url": settings.auth_jwks_url,
            "token_url": settings.auth_token_url,
            "issuer": settings.auth_issuer,
            "audience": settings.auth_audience,
        },
    )
    providers: list[AuthProvider] = [registry.get(AUTH, "local")]

    if settings.auth_oidc_issuer:
        config: dict[str, str] = {
            "issuer": settings.auth_oidc_issuer,
            "audience": settings.auth_oidc_audience,
            "roles_claim": settings.auth_oidc_roles_claim,
        }
        if settings.auth_oidc_discovery_url:
            config["discovery_url"] = settings.auth_oidc_discovery_url
        registry.configure(PluginKind.AUTH, "oidc", config)
        providers.append(registry.get(AUTH, "oidc"))

    return Authenticator(providers, allow_anonymous=settings.allow_legacy_anonymous)


def require(scope: str) -> Callable[[Request], Awaitable[Principal]]:
    """Build a dependency that authenticates the caller and checks ``scope``.

    The verified caller is returned, kept on ``request.state.principal``, and
    bound so calls this request makes to other services carry its identity.
    """

    async def dependency(request: Request) -> Principal:
        authenticator: Authenticator = request.app.state.authenticator
        principal = await authenticator.authenticate(request.headers.get("authorization"))
        require_scope(principal, scope)
        bind_credential(principal.credential)
        request.state.principal = principal
        return principal

    return dependency
