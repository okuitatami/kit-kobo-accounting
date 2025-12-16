# クイックスタートガイド

KIT工房 会計システムを最速で動かすための簡単ガイド

---

## 🚀 5分でスタート

### ステップ1: Supabaseのセットアップ (2分)

1. [https://supabase.com](https://supabase.com) にアクセス
2. 「Start your project」→ GitHub でサインイン
3. 「New Project」をクリック
   - Name: `kit-kobo-accounting`
   - Password: 強力なパスワード
   - Region: Tokyo
   - 「Create」をクリック（2分待つ）

4. SQL Editorを開く
   - 左メニュー「SQL Editor」
   - 「New query」
   - `supabase-setup.sql` の内容を貼り付け
   - 「Run」をクリック

5. APIキーをメモ
   - 左メニュー「Settings」→「API」
   - Project URL: `https://xxxxx.supabase.co`
   - anon public: `eyJhbGc...`

---

### ステップ2: コードを修正 (1分)

`js/app.js` の先頭（6〜9行目）を編集：

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // ここに実際のURLを入力
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // ここに実際のKeyを入力
```

保存してください。

---

### ステップ3: ローカルで動作確認 (1分)

ブラウザで `index.html` を開く：

```bash
# 方法1: ダブルクリック
index.html をダブルクリック

# 方法2: ローカルサーバー（推奨）
npx serve .
# または
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開く

---

### ステップ4: 動作確認 (1分)

1. 「👥 顧客管理」タブを開く
2. テスト顧客を登録：
   - 顧客名: テスト太郎
   - 会社名: テスト株式会社
   - 「顧客を登録」をクリック

3. Supabaseで確認：
   - Supabase Dashboard → Table Editor
   - `customers` テーブルにデータが追加されていればOK！

---

## 🌐 本番環境にデプロイ (5分)

### 方法1: Vercel（推奨）

1. GitHubにリポジトリ作成
2. [https://vercel.com](https://vercel.com) にアクセス
3. 「New Project」→ GitHubリポジトリを選択
4. Environment Variables を追加：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. 「Deploy」をクリック
6. 完成！

詳細は [DEPLOYMENT.md](DEPLOYMENT.md) を参照

---

### 方法2: Cloudflare Pages

1. GitHubにリポジトリ作成
2. [https://pages.cloudflare.com](https://pages.cloudflare.com) にアクセス
3. 「Create a project」
4. GitHubリポジトリを接続
5. 「Save and Deploy」

---

## 💡 最初にやること

### 1. 会社情報の変更

`js/app.js` の `COMPANY_INFO` を編集：

```javascript
const COMPANY_INFO = {
    name: 'あなたの屋号',
    representative: 'あなたの名前',
    address: 'あなたの住所',
    phone: 'あなたの電話番号',
    bank: {
        name: 'あなたの銀行名',
        branch: 'あなたの支店名',
        accountNumber: 'あなたの口座番号',
        accountName: 'あなたの名義'
    }
};
```

### 2. 顧客を登録

「👥 顧客管理」タブで実際の顧客を登録

### 3. サービスを登録

「🔧 サービス管理」タブで提供サービスを登録

### 4. 日々の記帳を開始

「📖 仕訳帳」タブで取引を記録

---

## 📱 よくある質問

### Q: エラーが出る

**A**: ブラウザのコンソールを確認してください（F12キー）

### Q: データが保存されない

**A**: Supabase URLとAPIキーが正しいか確認してください

### Q: スマホで使いたい

**A**: Vercelにデプロイすれば、どこからでもアクセス可能です

---

## 📚 次のステップ

- [README.md](README.md) - 詳細な機能説明
- [DEPLOYMENT.md](DEPLOYMENT.md) - デプロイ手順
- [複式簿記の使い方](README.md#-複式簿記の基本)

---

## 🆘 困ったら

1. [README.md](README.md) のトラブルシューティングを確認
2. Supabase Dashboard でテーブルとデータを確認
3. ブラウザのコンソールでエラーメッセージを確認

---

**これで準備完了！早速使い始めましょう！🎉**
