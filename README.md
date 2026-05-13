# AIR — AI Router for Browser

A Chrome extension that routes prompts to AI chat sites (ChatGPT / Claude / Gemini) from a single URL.
Built with [WXT](https://wxt.dev) + TypeScript. Designed for firing off AI chats from external tools like Raycast.

## URL scheme

```
https://ai.router/<provider>?<params>
```

- `<provider>`: `chatgpt` | `claude` | `gemini`
- Param names are matched after normalization (lowercase + strip `[-_]`), so `newTab`, `new-tab`, `NEW_TAB` all work.

| Key (aliases) | Values | Default | Description |
|---|---|---|---|
| `q` / `p` / `prompt` | string | `""` | Prompt to send |
| `m` / `mode` | `instant` \| `thinking` | _(unset)_ | Model class. When omitted, the current model is kept as-is. |
| `session` | `new` \| `replace` \| `append` | `replace` | Tab/chat reuse strategy |

### `session` behavior

- `new` — always open a new tab with a new chat.
- `replace` — reuse an existing tab if present, start a new chat in it; otherwise open a new tab.
- `append` — reuse an existing tab as a follow-up to its current chat; otherwise open a new tab with a new chat.

## Development

```bash
pnpm install
pnpm dev          # Chrome dev build with hot reload
pnpm build        # Production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome lint
pnpm check        # biome check --write (lint + format + import sort)
```

See [AGENTS.md](./AGENTS.md) for architecture, automation script constraints, and how to add a new provider.
