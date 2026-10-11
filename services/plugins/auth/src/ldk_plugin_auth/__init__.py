"""llm-dev-kit plugins: authentication (``auth.local`` and ``auth.oidc``).

``auth.local`` trusts the web app, which is the identity service in every
deployment (decision D2): it verifies the RS256 access tokens the web app
signs and exchanges personal ``sk-ldk-`` API keys for one. ``auth.oidc``
verifies tokens from any OpenID Connect issuer directly, for clients that
hold one, such as a service account in Keycloak.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from ldk_core.plugins import Plugin, load_manifest
from ldk_plugin_auth.local import EXCHANGE_CACHE_SECONDS, LocalAuthProvider
from ldk_plugin_auth.oidc import OidcAuthProvider


def _local(config: Mapping[str, Any]) -> LocalAuthProvider:
    return LocalAuthProvider(
        jwks_url=config["jwks_url"],
        token_url=config["token_url"],
        issuer=config["issuer"],
        audience=config["audience"],
        timeout=float(config.get("timeout", 5)),
    )


def _oidc(config: Mapping[str, Any]) -> OidcAuthProvider:
    return OidcAuthProvider(
        issuer=config["issuer"],
        audience=config["audience"],
        discovery_url=config.get("discovery_url"),
        jwks_url=config.get("jwks_url"),
        roles_claim=config.get("roles_claim", "realm_access.roles"),
        default_role=config.get("default_role", "viewer"),
        timeout=float(config.get("timeout", 5)),
    )


local_plugin = Plugin(load_manifest(__name__, "manifests/auth.local.json"), _local)
oidc_plugin = Plugin(load_manifest(__name__, "manifests/auth.oidc.json"), _oidc)

__all__ = [
    "EXCHANGE_CACHE_SECONDS",
    "LocalAuthProvider",
    "OidcAuthProvider",
    "local_plugin",
    "oidc_plugin",
]
