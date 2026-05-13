# AIR — AI Router for Browser

A Chrome extension that routes prompts to AI chat sites (ChatGPT / Claude / Gemini) from a single URL.
Built with WXT + TypeScript. Designed for hitting AI chats from external tools like Raycast.

## URL Scheme

```
https://air/<provider>?<params>
```

- `<provider>`: `chatgpt` | `claude` | `gemini` (declared in the `providers` registry at `lib/automation/index.ts`)
- Parameter names are matched after normalization (**lowercase + strip `[-_]`**), so `newTab`, `new-tab`, `NEW_TAB`, etc. are all equivalent.

### Parameters

| Key (aliases) | Values | Default | Description |
|---|---|---|---|
| `q` / `p` / `prompt` | string | `""` | Prompt to send |
| `m` / `mode` | `instant` \| `thinking` | _(unset)_ | Model class. When omitted, the current model selection is kept as-is. |
| `session` | `new` \| `replace` \| `append` | `replace` | How to handle the tab and chat |
| `send` | `true` \| `false` | `true` | When `false`, insert the prompt into the editor but don't click send (`false`/`0`/`no` are all accepted). |

### `session` behavior

- `new`: Skip the existing-tab lookup; always open a new tab with a new chat.
- `replace`: Reuse an existing tab if present (focus it + cmd/ctrl+shift+o to start a new chat); otherwise open a new tab.
- `append`: Reuse an existing tab as a follow-up to its current chat; otherwise open a new tab with a new chat.

## Flow

```
User navigates to https://air/<provider>?q=...
  ↓
background's webNavigation.onBeforeNavigate fires
  ↓
Branch based on session:
  ├─ Reusing an existing tab
  │    focus → (replace only: cmd+shift+o for new chat) → run automation
  │    The air tab is closed
  └─ New tab
       Redirect the air tab to the provider origin
       Run automation on webNavigation.onCompleted
  ↓
The provider's automation script is injected via
scripting.executeScript({ world: "MAIN" }):
  - Select model (skipped when mode is unset or followUp is true)
  - Insert prompt (document.execCommand + fallback)
  - Click the send button (skipped when send is false)
```

## Architecture

```
entrypoints/
  background.ts         Routing / tab management / dispatch
lib/router/
  params.ts             Pure URL-param parsers (readMode/readSend/readSession/...)
  params.test.ts        Vitest unit tests for the parsers
lib/automation/
  types.ts              Mode / AutomationArgs / AutomationFn / ProviderConfig
  index.ts              providers registry (origin + automate map)
  chatgpt.ts            ChatGPT automation (self-contained)
  claude.ts             Claude automation (self-contained)
  gemini.ts             Gemini automation (self-contained)
```

### Automation script constraints

- `chrome.scripting.executeScript({ func })` serializes the function via `.toString()` and runs it in the page's MAIN world. **Helpers must be defined inside the function** — outer references resolve to `undefined` at injection time.
- That's why `sleep` / `waitForElement` / `simulatePointerClick` are duplicated inside each provider's function.
- Selectors break easily when the target service ships UI changes. Verify `data-testid` / `aria-label` in DevTools and adjust.

### Adding a new provider

1. Create `lib/automation/<name>.ts` exporting `automate<Name>: AutomationFn`.
   - Keep it self-contained (helpers inside the function).
   - Accept `mode` (instant/thinking) and `followUp` as arguments.
2. Register `<name>: { origin, automate }` in the `providers` map at `lib/automation/index.ts`.
3. Add the target origin to `host_permissions` in `wxt.config.ts`.
4. The `Provider` type is derived as `keyof typeof providers`, so no other changes are needed.

## Dev commands

```bash
pnpm dev          # Run Chrome dev build with hot reload
pnpm build        # Production build for Chrome
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest run (unit tests for lib/router)
pnpm test:watch   # vitest watch mode
pnpm lint         # biome lint
pnpm check        # biome check --write (lint + format + import sort)
pnpm format       # biome format --write
```

## Constraints & known issues

- `document.execCommand("insertText")` is deprecated but remains the most reliable way to insert text into ProseMirror / Quill editors, so we keep using it.
- Selectors are fragile against AI services' UI churn. When something breaks, update the relevant `lib/automation/<provider>.ts`.
