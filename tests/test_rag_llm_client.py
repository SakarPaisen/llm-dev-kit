"""rag-service's client for llm-service forwards the caller's request id."""

import asyncio
import json

import httpx

from ldk_core.observability import correlation_scope
from rag_service.llm_client import LLMServiceClient


def _client(seen: list[str | None]) -> LLMServiceClient:
    def handle(request: httpx.Request) -> httpx.Response:
        seen.append(request.headers.get("x-request-id"))
        if request.url.path == "/generate/stream":
            lines = [{"delta": "hi"}, {"done": True}]
            return httpx.Response(200, text="\n".join(json.dumps(line) for line in lines))
        if request.url.path == "/embed":
            return httpx.Response(200, json={"embeddings": [[0.1, 0.2]]})
        return httpx.Response(200, json={"models": ["llama3.1"]})

    return LLMServiceClient("http://llm.test", 5, transport=httpx.MockTransport(handle))


def test_every_call_to_llm_service_carries_the_request_id() -> None:
    seen: list[str | None] = []
    client = _client(seen)

    async def calls() -> None:
        with correlation_scope("req-42"):
            await client.models()
            await client.embed_one("text")
            assert [d async for d in client.generate_stream("prompt")] == ["hi"]
        await client.close()

    asyncio.run(calls())
    assert seen == ["req-42", "req-42", "req-42"]


def test_no_header_outside_a_request() -> None:
    seen: list[str | None] = []
    client = _client(seen)

    async def call() -> None:
        await client.models()
        await client.close()

    asyncio.run(call())
    assert seen == [None]
