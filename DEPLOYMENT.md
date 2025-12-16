# デプロイ手順書

KIT工房 確定申告対応会計システムをVercel + Supabaseで本番環境にデプロイする手順

---

## 📋 事前準備

以下のアカウントを準備してください：

- ✅ [GitHub](https://github.com) アカウント（すでにお持ち）
- ✅ [Supabase](https://supabase.com) アカウント（すでにお持ち）
- ✅ [Vercel](https://vercel.com) アカウント（すでにお持ち）

---

## ステップ1: Supabaseプロジェクトのセットアップ

### 1-1. プロジェクトの作成

1. [Supabase Dashboard](https://app.supabase.com) を開く
2. 「New Project」をクリック
3. 以下を入力：
   - **Name**: `kit-kobo-accounting`
   - **Database Password**: 強力なパスワード（必ずメモ！）
   - **Region**: `Northeast Asia (Tokyo)` を選択
4. 「Create new project」をクリック
5. プロビジョニングが完了するまで2〜3分待つ

### 1-2. データベーステーブルの作成

1. 左メニューから「**SQL Editor**」をクリック
2. 「**New query**」をクリック
3. プロジェクトの `supabase-setup.sql` ファイルの内容をコピー
4. エディタにペースト
5. 「**Run**」をクリック
6. 成功メッセージが表示されることを確認

### 1-3. APIキーの取得

1. 左メニューから「**Settings**」→「**API**」をクリック
2. 以下の情報をメモ（後で使用）：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**📝 メモ例:**
```
Project URL: https://abcdefghijk.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
```

---

## ステップ2: GitHubリポジトリの作成

### 2-1. ローカルでGit初期化（コマンドライン使用）

```bash
# プロジェクトディレクトリに移動
cd kit-kobo-accounting

# Gitを初期化
git init

# すべてのファイルをステージング
git add .

# 初回コミット
git commit -m "Initial commit: KIT工房 Supabase版"

# デフォルトブランチをmainに設定
git branch -M main
```

### 2-2. GitHubに新しいリポジトリを作成

1. [GitHub](https://github.com) にログイン
2. 右上の「+」→「New repository」をクリック
3. 以下を入力：
   - **Repository name**: `kit-kobo-accounting`
   - **Visibility**: `Private` を選択（個人情報を含むため）
4. 「Create repository」をクリック

### 2-3. ローカルとGitHubを接続

GitHubに表示されるコマンドを実行：

```bash
git remote add origin https://github.com/あなたのユーザー名/kit-kobo-accounting.git
git push -u origin main
```

**✅ 確認**: GitHubのリポジトリページを開いて、ファイルがアップロードされていることを確認

---

### 2-4. Web UI での方法（コマンドが苦手な方向け）

1. [GitHub](https://github.com) にログイン
2. 「New repository」をクリック
3. Repository name: `kit-kobo-accounting`、Private を選択
4. 「Create repository」をクリック
5. 「uploading an existing file」リンクをクリック
6. すべてのファイル（index.html、css/、js/、README.md など）をドラッグ&ドロップ
7. Commit message: "Initial commit"
8. 「Commit changes」をクリック

---

## ステップ3: Vercelへのデプロイ

### 3-1. Vercelプロジェクトの作成

1. [Vercel](https://vercel.com) にログイン
2. 「**Add New...**」→「**Project**」をクリック
3. GitHubアカウントに接続（初回のみ）
4. リポジトリ一覧から「**kit-kobo-accounting**」を選択
5. 「**Import**」をクリック

### 3-2. プロジェクト設定

#### Configure Project画面で：

1. **Framework Preset**: `Other` を選択
2. **Root Directory**: そのまま（デフォルト）
3. **Build Command**: 空欄（静的サイトなので不要）
4. **Output Directory**: 空欄
5. **Install Command**: 空欄

### 3-3. 環境変数の設定

**Environment Variables** セクションで：

1. 「**Add Environment Variable**」をクリック
2. 以下の2つの変数を追加：

#### 変数1: SUPABASE_URL
- **Key**: `SUPABASE_URL`
- **Value**: `https://xxxxx.supabase.co` （ステップ1-3でメモした値）
- Environment: `Production`, `Preview`, `Development` すべてチェック

#### 変数2: SUPABASE_ANON_KEY
- **Key**: `SUPABASE_ANON_KEY`
- **Value**: `eyJhbGc...` （ステップ1-3でメモした値）
- Environment: `Production`, `Preview`, `Development` すべてチェック

### 3-4. デプロイ実行

1. 「**Deploy**」ボタンをクリック
2. デプロイが開始されます（2〜3分）
3. 「**Congratulations!**」画面が表示されたら成功

### 3-5. デプロイ後の確認

1. 発行されたURLをクリック（例: `https://kit-kobo-accounting.vercel.app`）
2. アプリが正常に開くことを確認
3. 顧客を1件登録してみる
4. Supabaseのダッシュボードで「Table Editor」を開き、データが保存されていることを確認

---

## ステップ4: 環境変数をアプリに反映

現在、`js/app.js` には環境変数がハードコードされています。Vercelの環境変数を使うように修正します。

### 4-1. js/app.js の修正

`js/app.js` の先頭部分を以下のように変更：

**変更前:**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';
```

**変更後:**
```javascript
// Vercel環境変数から取得
const SUPABASE_URL = '実際のSupabase URL';
const SUPABASE_ANON_KEY = '実際のSupabase Anon Key';
```

### 4-2. 変更をGitHubにプッシュ

```bash
git add js/app.js
git commit -m "Update Supabase credentials"
git push
```

### 4-3. 自動再デプロイ

Vercelが自動的にGitHubの変更を検知して再デプロイします（1〜2分）

---

## ステップ5: 独自ドメインの設定（オプション）

### 5-1. Vercelでドメイン追加

1. Vercelプロジェクトページで「**Settings**」→「**Domains**」をクリック
2. 独自ドメイン（例: `accounting.kit-kobo.com`）を入力
3. 「**Add**」をクリック
4. DNS設定の指示に従う

### 5-2. DNS設定（お名前.com、ムームードメインなど）

Vercelが表示するDNSレコードを、ドメイン管理サービスで設定：

**Aレコード:**
```
Type: A
Name: accounting (またはサブドメイン)
Value: 76.76.21.21 (Vercelが指示するIP)
```

**CNAMEレコード:**
```
Type: CNAME
Name: accounting
Value: cname.vercel-dns.com
```

### 5-3. SSL証明書の自動発行

Vercelが自動的にSSL証明書を発行します（数分〜数時間）

---

## ステップ6: 動作確認

### 6-1. 基本機能のテスト

1. **顧客登録**
   - 「👥 顧客管理」タブ
   - サンプル顧客を1件登録
   - Supabase Dashboard → Table Editor で確認

2. **サービス登録**
   - 「🔧 サービス管理」タブ
   - サンプルサービスを1件登録

3. **仕訳入力**
   - 「📖 仕訳帳」タブ
   - テスト仕訳を入力（例: 普通預金 10,000円 / 事業主借 10,000円）

4. **ダッシュボード確認**
   - 「📊 ダッシュボード」タブ
   - グラフが表示されることを確認

### 6-2. スマホでの動作確認

1. スマホからアプリのURLにアクセス
2. 仕訳帳で入力してみる
3. レスポンシブデザインが機能していることを確認

---

## トラブルシューティング

### ❌ 「Supabaseが設定されていません」と表示される

**原因**: 環境変数が正しく設定されていない

**解決方法**:
1. Vercel Dashboard → Settings → Environment Variables を確認
2. `SUPABASE_URL` と `SUPABASE_ANON_KEY` が正しく設定されているか確認
3. 再デプロイ: Deployments → 最新のデプロイ → 「Redeploy」

### ❌ データが保存されない

**原因**: Supabase RLSポリシーの問題

**解決方法**:
1. Supabase Dashboard → SQL Editor を開く
2. 以下のSQLを実行：
```sql
-- RLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename IN ('customers', 'services', 'journal_entries', 'invoices', 'quotations');
```
3. ポリシーが存在しない場合は、`supabase-setup.sql` を再実行

### ❌ Vercelのビルドが失敗する

**原因**: ファイル構成の問題

**解決方法**:
1. `index.html` がルートディレクトリにあることを確認
2. `css/` と `js/` フォルダが正しく配置されていることを確認
3. GitHub リポジトリで確認

### ❌ 環境変数が反映されない

**原因**: 変数名の誤り、またはVercelの再デプロイが必要

**解決方法**:
1. 変数名が正確に `SUPABASE_URL` と `SUPABASE_ANON_KEY` か確認
2. Vercel → Deployments → Redeploy をクリック

---

## 🎉 デプロイ完了チェックリスト

- [ ] Supabaseプロジェクトが作成されている
- [ ] データベーステーブルが作成されている
- [ ] RLSポリシーが設定されている
- [ ] GitHubリポジトリが作成されている
- [ ] すべてのファイルがプッシュされている
- [ ] Vercelプロジェクトが作成されている
- [ ] 環境変数が設定されている
- [ ] デプロイが成功している
- [ ] アプリが正常に開く
- [ ] データの登録・読み込みが動作する
- [ ] スマホで表示できる

---

## 📞 サポートが必要な場合

- Supabase公式ドキュメント: https://supabase.com/docs
- Vercel公式ドキュメント: https://vercel.com/docs
- GitHub Issuesで質問を投稿

---

## 🔒 セキュリティのベストプラクティス

### 必ず実施してください：

1. **`.env` ファイルをGitに含めない**
   - `.gitignore` に `.env` が含まれていることを確認

2. **Supabase APIキーを公開しない**
   - GitHubのリポジトリを Private に設定

3. **定期的なバックアップ**
   - Supabase Dashboard → Database → Backups

4. **強力なパスワード**
   - Supabaseのデータベースパスワードは複雑なものを使用

### 本番運用時に推奨：

1. **ユーザー認証の実装**
   - Supabase Auth を使用

2. **RLSポリシーの強化**
   - 認証されたユーザーのみアクセス可能に

3. **監視・ログ**
   - Vercelのアナリティクスを有効化
   - Supabaseのログを定期確認

---

**デプロイ完了おめでとうございます！🎉**

これでKIT工房の会計システムが本番環境で稼働しています。
