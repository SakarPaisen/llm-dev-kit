# Using LLM Dev Kit: documents and chat

This guide covers the current version on `main`. It is for two kinds of
people:

- **The host** runs the stack, adds documents and lets other people in. This
  needs a terminal, Docker and Ollama.
- **Everyone else** signs in and chats in the browser. No setup is needed.

If the stack is not running yet, the host starts with [setup.md](setup.md).

## How it works

The host uploads PDFs. Each one is split into chunks, embedded on the host's
machine with `nomic-embed-text`, and stored in a single index that every user
shares. When someone asks a question, the three closest chunks are retrieved,
and the model is told to answer from those chunks only.

## For the host

### Add documents

Upload PDFs from the command line. There is no upload button in the app yet;
it comes with per-user documents ([#15](https://github.com/sameeralam3127/llm-dev-kit/issues/15)).

```bash
curl -F "file=@handbook.pdf" http://localhost:8080/api/rag/ingest/pdf
# {"chunks":12}
```

- **PDF only, up to 64 MB per file.** Text is read from the PDF's text layer
  and there is no OCR: scanned pages add nothing, and a PDF with no text at
  all is refused with a 400.
- **Uploading the same file twice indexes it twice.** To replace a document,
  clear the index and upload everything again.
- **Clear cached answers after changing documents.** Answers are cached for an
  hour by question and model, so without this a repeated question can return
  the answer from before the change:

  ```bash
  curl -X POST http://localhost:8080/api/rag/cache/clear
  ```

### Check and clear the index

```bash
# how many chunks are indexed
curl http://localhost:8080/api/rag/documents/stats

# remove every document, for every user
curl -X POST http://localhost:8080/api/rag/documents/clear
```

There is no way to remove a single document.

### Let other people in

**On the same computer**, people open http://localhost:8080 and create an
account.

**From other computers on your network:**

1. In `.env`, set:

   ```bash
   GATEWAY_BIND=0.0.0.0
   WEB_PUBLIC_URL=http://<this-machine's-IP>:8080
   ```

   `WEB_PUBLIC_URL` must be the address people type into their browser. If it
   is left as `localhost`, sign-in redirects them to their own machine.
2. Run `docker compose up -d` to apply the change.
3. Send people the address so they can create accounts.
4. Once they have, set `ALLOW_REGISTRATION=false` and run
   `docker compose up -d` again, so nobody else can sign up. There is no
   admin screen or invite system yet ([#17](https://github.com/sameeralam3127/llm-dev-kit/issues/17)).

> [!WARNING]
> Only the chat app asks people to sign in; the APIs behind it do not. With
> `GATEWAY_BIND=0.0.0.0`, anyone who can reach port 8080 can upload
> documents, clear the index, and use your models through `/v1`, with no
> account. Only do this on a network where you trust everyone. Sign-in for the
> APIs arrives with Phase 4 ([#14](https://github.com/sameeralam3127/llm-dev-kit/issues/14)).

## For everyone: chatting

1. Open the address the host gives you, for example
   `http://192.168.1.20:8080`.
2. Create an account. Passwords need at least 10 characters, including a
   letter and a number.
3. Type a question and press **Enter**. **Shift + Enter** starts a new line.
   The answer appears as it is written; the stop button ends it early.

Useful while chatting:

- **Model:** pick one at the top right. Models run on the host's machine,
  **except those whose names end in `-cloud`**, which send your question and
  the matching document text to ollama.com.
- **Edit** one of your messages to rewind the conversation to that point.
  **Regenerate** an answer to try again; earlier answers stay reachable through
  the `‹ 2/3 ›` arrows.
- **Search:** <kbd>⌘K</kbd> (<kbd>Ctrl K</kbd> on Windows and Linux) searches
  all your chats. <kbd>⇧⌘O</kbd> starts a new chat and <kbd>⌘B</kbd> hides the
  sidebar.
- **Organise:** pin chats, or put them in folders from the sidebar.
- **Share:** the share button publishes a read-only copy of a chat. Anyone with
  the link can read it without signing in, until you turn sharing off.

### What to expect from answers

- **When documents are indexed, answers come only from them.** If you ask about
  something the documents do not cover, the model says so instead of answering
  from general knowledge.
- **When no documents are indexed,** it works as a general assistant.
- **Ask specific questions.** Each answer sees only the three most relevant
  passages, so "summarise everything" over a large document set covers only a
  small part of it.
- **The chat does not show which document an answer came from.** Ask the model
  to quote the passage it used.

### Who can see what

- **Your chats are private to your account.** Other users cannot see them
  unless you share a link.
- **Documents are shared by everyone.** Anything one person's upload contains
  can appear in anyone's answer. Per-user documents arrive in Phase 5
  ([#15](https://github.com/sameeralam3127/llm-dev-kit/issues/15)).
- **The host can read everything.** Chats are stored in a database on the
  host's machine.

## Other ways to ask questions

Both of these use the same documents as the chat app.

- **Any OpenAI SDK or client**, such as Open WebUI or LangChain: point it at
  `http://<host>:8080/v1`, use the model `llama3.1`, and any API key starting
  with `sk-local`. See [API Reference](../README.md#api-reference).
- **Claude Desktop or another MCP client:** run
  `docker compose --profile mcp run --rm -T mcp` as the server command. It
  provides two tools, `ask_llm_dev_kit` and `list_models`. See
  [MCP Usage](../README.md#mcp-usage).

## Current limits

| Limit | Planned in |
| --- | --- |
| PDFs only, uploaded from the command line | [#15](https://github.com/sameeralam3127/llm-dev-kit/issues/15) |
| One shared index; no deleting a single document; re-uploads duplicate | [#15](https://github.com/sameeralam3127/llm-dev-kit/issues/15) |
| Cached answers do not update when documents change | Clear the cache by hand (see above) |
| When documents are indexed, every chat answers from them only | Not planned yet |
| No sign-in on the APIs | [#14](https://github.com/sameeralam3127/llm-dev-kit/issues/14) |
| No admin screen or invites | [#17](https://github.com/sameeralam3127/llm-dev-kit/issues/17) |
| `-cloud` models leave the machine | [#13](https://github.com/sameeralam3127/llm-dev-kit/issues/13) |
