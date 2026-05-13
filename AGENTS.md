# AI Router

ChatGPT / Claude / Gemini など AI チャット系ウェブサイトに対してプロンプトを送信する Chrome 拡張。
WXT + TypeScript。Raycast など外部ツールから URL 一発で AI チャットに送れる用途を想定。

## URL スキーム

```
https://ai.router/<provider>?<params>
```

- `<provider>`: `chatgpt` | `claude` | `gemini`（`lib/automation/index.ts` の `providers` レジストリで定義）
- パラメータ名は **lowercase + `[-_]` 除去** で正規化マッチ（`newTab`, `new-tab`, `NEW_TAB` などすべて同じ）

### パラメータ

| キー (alias) | 値 | デフォルト | 説明 |
|---|---|---|---|
| `q` / `p` / `prompt` | string | `""` | 送信するプロンプト |
| `m` / `mode` | `instant` \| `thinking` | `instant` | モデルの種類 (instant: 速いモデル / thinking: 推論モデル) |
| `session` | `new` \| `replace` \| `append` | `replace` | タブとチャットの扱い |

### `session` の挙動

- `new`: 既存タブを探さず、常に新規タブで新規チャット
- `replace`: 既存タブがあれば focus + cmd/ctrl+shift+o で新規チャット。なければ新規タブ
- `append`: 既存タブがあれば現在のチャットへフォローアップ送信。なければ新規タブで新規チャット

## 動作フロー

```
ユーザが https://ai.router/<provider>?q=... へナビゲート
  ↓
background の webNavigation.onBeforeNavigate が検知
  ↓
session に応じて分岐:
  ├─ 既存タブを再利用する場合
  │    focus → (replace: cmd+shift+o で新規チャット) → automation 実行
  │    ai.router タブは閉じる
  └─ 新規タブの場合
       ai.router タブを provider origin にリダイレクト
       webNavigation.onCompleted で automation 実行
  ↓
provider 別 automation スクリプトを `scripting.executeScript({ world: "MAIN" })` で注入
  - モデル選択 (followUp 時はスキップ)
  - プロンプト入力 (document.execCommand + フォールバック)
  - 送信ボタンクリック
```

## アーキテクチャ

```
entrypoints/
  background.ts         ルーティング / タブ管理 / dispatch
lib/automation/
  types.ts              Mode / AutomationArgs / AutomationFn / ProviderConfig
  index.ts              providers レジストリ (origin + automate のマップ)
  chatgpt.ts            ChatGPT 自動化 (self-contained)
  claude.ts             Claude 自動化 (self-contained)
  gemini.ts             Gemini 自動化 (self-contained)
```

### automation スクリプトの注意点

- `chrome.scripting.executeScript({ func })` は関数を `.toString()` でシリアライズしてページの MAIN world で実行する。**helpers は必ず関数内で定義する**こと（外部参照は注入時に undefined になる）
- 各プロバイダ毎に `sleep` / `waitForElement` / `simulatePointerClick` を関数内で重複定義しているのは上記制約のため
- セレクタは各サービスの UI 更新で壊れやすいので DevTools で `data-testid` / `aria-label` を確認して調整する

### 新プロバイダの追加手順

1. `lib/automation/<name>.ts` を作って `automate<Name>: AutomationFn` を実装
   - 必ず self-contained に書く (helpers は関数内)
   - `mode` (instant/thinking) と `followUp` を引数で受け取る
2. `lib/automation/index.ts` の `providers` に `<name>: { origin, automate }` を追加
3. `wxt.config.ts` の `host_permissions` に対象オリジンを追加
4. `Provider` 型は `keyof typeof providers` から自動導出されるため他の変更は不要

## 開発コマンド

```bash
pnpm dev          # Chrome 用 dev 起動 (拡張ホットリロード)
pnpm build        # Chrome 用ビルド
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome lint
pnpm check        # biome check --write (lint + format + import sort)
pnpm format       # biome format --write
```

## 制約・既知の問題

- ホスト `ai.router` は実在しないため DNS 解決前に webNavigation で割り込む形。`https://` を明示する必要あり (アドレスバーから入力すると検索になりがち)
- `triggerNewChatShortcut` が dispatch する `KeyboardEvent` は `isTrusted: false`。アプリ側が trusted チェックしていると無視される。現状 ChatGPT/Claude/Gemini では動作確認済み
- `document.execCommand("insertText")` は deprecated だが ProseMirror / Quill 系エディタへの入力としては最も確実なので使用継続
- セレクタは AI サービス側の UI 改修で壊れることがある。動かなくなったら各 `lib/automation/<provider>.ts` を更新
