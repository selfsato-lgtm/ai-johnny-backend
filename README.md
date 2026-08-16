# AIジョニー

恋愛式学（16タイプ診断）に基づき、写真・動画・プロフィール文章から相手のタイプを分析するAI診断ツール。

## 構成
- `public/index.html` — フロントエンド（GitHub Pages / Vercelどちらでも配信可）
- `api/analyze.js` — Vercel Serverless Function。Anthropic APIを呼び出す

## セットアップ（Vercel）
1. このリポジトリをVercelにインポート
2. Project Settings → Environment Variables に `ANTHROPIC_API_KEY` を設定
3. デプロイ後、`https://<プロジェクト名>.vercel.app/` でフロントエンドが開き、`/api/analyze` にリクエストが飛ぶ
