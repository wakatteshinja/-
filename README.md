# Digital Scorer Pro

Next.js + Tailwind + Fabric.js + Supabase で構築したデジタル採点・管理システムです。

## セットアップ

1. 依存関係をインストール
```bash
npm install
```
2. `.env.local` を作成
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
3. Supabase SQL Editor で `supabase/schema.sql` を実行。
4. Storage バケットを作成。
   - `template-papers`
   - `answer-papers`
   - `annotated-papers`
5. 起動
```bash
npm run dev
```

## 主な機能
- 認証（ログイン/新規登録）
- 白紙答案のテンプレート化（小問枠 + 合計表示エリア指定）
- 連続採点（生徒サイドバー切替、リアルタイム合計）
- Fabric.js 赤ペン書き込み
- クラス名簿一括インポート（CSV/テキスト）
- 進捗/平均/最高/最低のダッシュボード表示
- CSV/ZIP エクスポート
- 採点済みアーカイブ一覧
