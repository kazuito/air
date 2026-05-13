# AI Router

ChatGPT.com や Claude.ai の AI チャット系ウェブサイトに対してプロンプトを送信するChrome拡張機能。

WXTフレームワーク、Typescriptで実装。

## 動作フロー

ユーザが https://ai-router/chatgpt?p=hello へリクエストを送信
↓
backgroundスクリプトでリクエスト検知して任意のサイトを開く
https://chatgpt.com/
↓
background（またはクライアント）からJSでプロンプト入力やモデル選択、プロンプト送信まで自動実行

これによりRaycastなど外部アプリからでもAIチャットにプロンプトを遅れる
