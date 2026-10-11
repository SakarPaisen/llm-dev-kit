"""MCP server over stdio exposing every enabled ``Tool`` plugin.

Uses the low-level MCP server rather than FastMCP because tools come from
the registry with their own JSON Schemas; FastMCP can only derive schemas
from Python function signatures. Results are shaped the way FastMCP shaped
them (text content plus ``{"result": ...}`` structured content), so existing
clients see no difference.
"""

import asyncio
import json
from collections.abc import Mapping
from typing import Any

import mcp.types as types
from mcp.server.lowlevel import Server
from mcp.server.stdio import stdio_server

from devkit_common.config import Settings, get_settings
from ldk_core.auth import credential_scope
from ldk_core.observability import configure_logging, correlation_scope, get_logger
from ldk_core.plugins import TOOL, PluginKind, PluginRegistry
from ldk_core.ports import Tool

_log = get_logger(__name__)


def build_registry(settings: Settings) -> PluginRegistry:
    """Discover installed plugins and configure the built-in tools."""
    registry = PluginRegistry()
    registry.load_entry_points()
    registry.configure(
        PluginKind.TOOL,
        "list_models",
        {"llm_service_url": settings.llm_service_url, "timeout_seconds": 30},
    )
    registry.configure(
        PluginKind.TOOL,
        "ask_llm_dev_kit",
        {
            "rag_service_url": settings.rag_service_url,
            "timeout_seconds": settings.request_timeout_seconds,
        },
    )
    return registry


def create_server(name: str, tools: list[Tool], *, api_key: str | None = None) -> Server[Any, Any]:
    """An MCP server that lists and calls ``tools``.

    Args:
        name: Shown to MCP clients.
        tools: What the server offers.
        api_key: The personal API key (``sk-ldk-...``) the tools present to
            rag- and llm-service. stdio carries no credentials of its own, so
            every call made through this server acts as that key's owner.
    """
    by_name = {tool.name: tool for tool in tools}
    server: Server[Any, Any] = Server(name)

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name=tool.name,
                description=tool.description,
                inputSchema=dict(tool.input_schema),
                outputSchema=_output_schema(tool),
            )
            for tool in by_name.values()
        ]

    # validate_input (the default) checks arguments against inputSchema
    # before the tool runs, as the Tool port requires.
    @server.call_tool()
    async def call_tool(
        name: str, arguments: dict[str, Any]
    ) -> tuple[list[types.ContentBlock], dict[str, Any]]:
        tool = by_name.get(name)
        if tool is None:
            raise ValueError(f"Unknown tool: {name}")
        # stdio has no request headers: give each call its own id and the
        # configured key, both of which the tools forward to the services.
        # The services verify the key; this process does not.
        with correlation_scope(), credential_scope(api_key):
            result = await tool.invoke(arguments, principal=None)
        return _content(result), {"result": result}

    return server


def _output_schema(tool: Tool) -> dict[str, Any] | None:
    """A tool's optional output schema; not part of the port, so not required."""
    schema: Mapping[str, Any] | None = getattr(tool, "output_schema", None)
    return dict(schema) if schema is not None else None


def _content(result: Any) -> list[types.ContentBlock]:
    """Text content the way FastMCP rendered it: one block per list item."""
    items = result if isinstance(result, list | tuple) else [result]
    return [
        types.TextContent(
            type="text", text=item if isinstance(item, str) else json.dumps(item, indent=2)
        )
        for item in items
    ]


async def serve() -> None:
    """Run the server on stdin/stdout until the client disconnects."""
    settings = get_settings()
    # stdout carries the MCP protocol; logs go to stderr.
    configure_logging(service="mcp-service", level=settings.log_level, fmt=settings.log_format)
    registry = build_registry(settings)
    if not settings.ldk_api_key:
        _log.warning("LDK_API_KEY is not set: tool calls will be refused with 401")
    server = create_server(settings.app_name, registry.get_all(TOOL), api_key=settings.ldk_api_key)
    try:
        async with stdio_server() as (read, write):
            await server.run(read, write, server.create_initialization_options())
    finally:
        await registry.aclose()


if __name__ == "__main__":
    asyncio.run(serve())
