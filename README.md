# KIT工房 確定申告対応会計システム（Supabase連携版）

個人事業主向けの確定申告対応会計管理アプリケーション（青色申告・複式簿記・65万円控除対応）

## 🎯 主要機能

### ✅ 確定申告機能
- **青色申告決算書（損益計算書）自動生成**
- **確定申告書への転記用データ出力**
- **青色申告特別控除 65万円に完全対応**
- e-Tax申告ガイド付き

### 📖 複式簿記による記帳
- 借方・貸方による正確な仕訳入力
- 20種類の勘定科目を事前設定
- 自動バランスチェック

### 📄 見積書・請求書管理
- 自動採番（Q-2025-001、I-2025-001形式）
- 顧客選択機能
- 見積書→請求書へのワンクリック変換
- PDF出力機能
- 振込先情報自動表示

### 👥 顧客管理
- 顧客情報の登録・編集・削除
- 請求書・見積書作成時に自動表示

### 🔧 サービス管理
- ウェブ制作、HP制作、音楽編集、動画編集など
- カテゴリ別管理

### 📥 CSV一括インポート（あおぞら銀行対応）
- Shift-JIS/CP932エンコーディング自動検出
- 科目自動推測機能
- プレビュー＆編集機能
- 一括登録

### 📊 ダッシュボード
- 年間売上・経費・利益の集計
- Chart.jsによる視覚的グラフ表示
- 最近の仕訳一覧

---

## 🚀 セットアップ手順

### ステップ1: Supabaseプロジェクトの作成

1. **Supabaseにログイン**
   - [https://supabase.com](https://supabase.com) にアクセス
   - GitHubアカウントでサインイン

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - Project name: `kit-kobo-accounting`
   - Database Password: 強力なパスワードを設定（必ずメモしておく）
   - Region: `Northeast Asia (Tokyo)` を選択
   - 「Create new project」をクリック
   - プロビジョニングに2〜3分かかります

---

### ステップ2: データベーステーブルの作成

プロジェクトが作成されたら、以下のSQLを実行してテーブルを作成します。

#### 方法: SQL Editorで実行

1. 左メニューから「SQL Editor」をクリック
2. 「New query」をクリック
3. 以下のSQLをコピー&ペースト
4. 「Run」をクリック

```sql
-- 顧客テーブル
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サービステーブル
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit_price NUMERIC,
  unit TEXT,
  tax_rate NUMERIC DEFAULT 0.10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 仕訳帳テーブル
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  debit_account TEXT NOT NULL,
  debit_amount NUMERIC NOT NULL,
  credit_account TEXT NOT NULL,
  credit_amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 請求書テーブル
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 見積書テーブル
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  items JSONB,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_journal_entries_date ON journal_entries(date DESC);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_quotations_customer ON quotations(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

### ステップ3: Row Level Security (RLS) の設定

セキュリティのため、RLSを有効にします。

```sql
-- RLSを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーに読み書き権限を付与（開発環境用）
-- 本番環境では認証を実装してください
CREATE POLICY "Enable all for all users" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON services FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON journal_entries FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON invoices FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON quotations FOR ALL USING (true);
```

**⚠️ 注意**: 上記のポリシーは開発・テスト用です。本番環境では適切な認証とアクセス制御を実装してください。

---

### ステップ4: APIキーの取得

1. 左メニューから「Settings」→「API」をクリック
2. 以下の情報をメモしておく：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`（長い文字列）

---

### ステップ5: 環境変数の設定

#### **開発環境（ローカル）の場合**

`js/app.js` の先頭部分を編集：

```javascript
const SUPABASE_URL = 'https://xxxxx.supabase.co'; // 取得したProject URL
const SUPABASE_ANON_KEY = 'eyJhbGc...'; // 取得したanon public key
```

#### **本番環境（Vercel）の場合**

1. Vercelプロジェクトページを開く
2. 「Settings」→「Environment Variables」をクリック
3. 以下の変数を追加：
   - Name: `SUPABASE_URL`, Value: `https://xxxxx.supabase.co`
   - Name: `SUPABASE_ANON_KEY`, Value: `eyJhbGc...`
4. 「Save」をクリック

次に、`index.html` の `<script>` タグの前に以下を追加：

```html
<script>
  // 環境変数をグローバル変数として設定
  window.SUPABASE_URL = '{{SUPABASE_URL}}';
  window.SUPABASE_ANON_KEY = '{{SUPABASE_ANON_KEY}}';
</script>
```

または、Vercelのビルドフック機能を使用して環境変数を注入します。

---

## 📦 デプロイ方法

### Vercel + GitHubでのデプロイ

#### 1. GitHubリポジトリの作成

```bash
# ローカルPCで実行
git init
git add .
git commit -m "Initial commit: KIT工房 Supabase版"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/kit-kobo-accounting.git
git push -u origin main
```

#### 2. Vercelにデプロイ

1. [Vercel](https://vercel.com) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリ `kit-kobo-accounting` を選択
4. 「Import」をクリック
5. Environment Variables に以下を追加：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
6. 「Deploy」をクリック

#### 3. デプロイ完了

2〜3分でデプロイが完了し、URLが発行されます。

例: `https://kit-kobo-accounting.vercel.app`

---

## 🔧 会社情報の変更

`js/app.js` の `COMPANY_INFO` オブジェクトを編集：

```javascript
const COMPANY_INFO = {
    name: 'KIT工房',
    representative: '奥井啓太',
    address: '兵庫県神戸市灘区永手町5丁目3-18-303',
    phone: '070-8403-3158',
    bank: {
        name: 'あおぞら銀行',
        branch: 'BANKブルー支店　普通預金',
        accountNumber: '0295638',
        accountName: 'オクイケイタ'
    }
};
```

---

## 📱 使い方

### 1. 顧客を登録

「👥 顧客管理」タブから顧客情報を登録します。

### 2. サービスを登録

「🔧 サービス管理」タブから提供サービスを登録します。

### 3. 日々の取引を記録

「📖 仕訳帳」タブから日々の取引を記録します。

#### 仕訳の例：

**売上が発生した場合**
```
日付: 2025/12/15
借方科目: 売掛金　　借方金額: 100,000円
貸方科目: 売上高　　貸方金額: 100,000円
摘要: ○○株式会社 ウェブサイト制作
```

**入金があった場合**
```
日付: 2026/01/20
借方科目: 普通預金　借方金額: 100,000円
貸方科目: 売掛金　　貸方金額: 100,000円
摘要: ○○株式会社 入金確認
```

**経費を支払った場合**
```
日付: 2025/12/05
借方科目: 通信費　　借方金額: 5,000円
貸方科目: 普通預金　貸方金額: 5,000円
摘要: 光回線料金 12月分
```

### 4. 見積書・請求書を作成

「📄 見積書」「🧾 請求書」タブから書類を作成します。

### 5. CSV一括インポート（月次）

「📥 CSV一括インポート」タブから、あおぞら銀行の取引明細をアップロードして一括登録します。

### 6. 確定申告レポートを生成

「📈 確定申告レポート」タブで年度を選択し、「レポート生成」をクリックします。

### 7. e-Taxで申告

生成されたレポートの数値を[国税庁の確定申告書等作成コーナー](https://www.keisan.nta.go.jp/)に入力して、e-Taxで申告します。

---

## 💡 複式簿記の基本

### よくある仕訳パターン

| 取引内容 | 借方 | 貸方 |
|---------|------|------|
| 売上発生 | 売掛金 | 売上高 |
| 入金 | 普通預金 | 売掛金 |
| 経費支払（銀行） | 経費科目 | 普通預金 |
| 経費支払（現金） | 経費科目 | 現金 |
| 生活費引出 | 事業主貸 | 普通預金 |
| 個人資金投入 | 普通預金 | 事業主借 |

---

## 🔒 セキュリティ注意事項

### 開発環境

- 現在のRLSポリシーは「すべてのユーザーに読み書き権限」を付与しています
- テスト・開発目的でのみ使用してください

### 本番環境

本番環境では以下の対策を推奨します：

1. **認証の実装**
   - Supabase Authを使用してユーザー認証を実装
   - ログイン機能の追加

2. **RLSポリシーの強化**
   ```sql
   -- 認証されたユーザーのみアクセス可能
   CREATE POLICY "Authenticated users only" ON customers
     FOR ALL USING (auth.role() = 'authenticated');
   ```

3. **環境変数の保護**
   - Supabase APIキーは環境変数で管理
   - GitHubにコミットしない（`.gitignore`に追加）

4. **バックアップ**
   - Supabaseの自動バックアップを有効化
   - 定期的なエクスポート

---

## 📊 データ構造

### customers（顧客）

| カラム | 型 | 説明 |
|-------|---|------|
| id | UUID | 主キー |
| name | TEXT | 顧客名 |
| company | TEXT | 会社名 |
| address | TEXT | 住所 |
| phone | TEXT | 電話番号 |
| email | TEXT | メールアドレス |
| created_at | TIMESTAMP | 作成日時 |

### services（サービス）

| カラム | 型 | 説明 |
|-------|---|------|
| id | UUID | 主キー |
| name | TEXT | サービス名 |
| category | TEXT | カテゴリ |
| unit_price | NUMERIC | 単価 |
| unit | TEXT | 単位 |
| tax_rate | NUMERIC | 消費税率 |
| created_at | TIMESTAMP | 作成日時 |

### journal_entries（仕訳帳）

| カラム | 型 | 説明 |
|-------|---|------|
| id | UUID | 主キー |
| date | DATE | 日付 |
| debit_account | TEXT | 借方科目 |
| debit_amount | NUMERIC | 借方金額 |
| credit_account | TEXT | 貸方科目 |
| credit_amount | NUMERIC | 貸方金額 |
| description | TEXT | 摘要 |
| created_at | TIMESTAMP | 作成日時 |

### invoices（請求書）

| カラム | 型 | 説明 |
|-------|---|------|
| id | UUID | 主キー |
| invoice_number | TEXT | 請求番号 |
| customer_id | UUID | 顧客ID（外部キー） |
| issue_date | DATE | 発行日 |
| due_date | DATE | 支払期限 |
| items | JSONB | 明細（JSON） |
| subtotal | NUMERIC | 小計 |
| tax | NUMERIC | 消費税 |
| total | NUMERIC | 合計 |
| status | TEXT | ステータス（unpaid/paid） |
| created_at | TIMESTAMP | 作成日時 |

### quotations（見積書）

| カラム | 型 | 説明 |
|-------|---|------|
| id | UUID | 主キー |
| quote_number | TEXT | 見積番号 |
| customer_id | UUID | 顧客ID（外部キー） |
| issue_date | DATE | 発行日 |
| expiry_date | DATE | 有効期限 |
| items | JSONB | 明細（JSON） |
| subtotal | NUMERIC | 小計 |
| tax | NUMERIC | 消費税 |
| total | NUMERIC | 合計 |
| created_at | TIMESTAMP | 作成日時 |

---

## 🆘 トラブルシューティング

### Q: データが保存されない

**A**: 以下を確認してください：
1. Supabase URLとAPIキーが正しく設定されているか
2. ブラウザのコンソールにエラーが表示されていないか
3. SupabaseのRLSポリシーが正しく設定されているか

### Q: 「Supabaseが設定されていません」と表示される

**A**: `js/app.js` の `SUPABASE_URL` と `SUPABASE_ANON_KEY` を正しく設定してください。

### Q: CSV一括インポートで文字化けする

**A**: encoding-japaneseライブラリが正しく読み込まれているか確認してください。CDNのURLが正しいか確認してください。

### Q: スマホで使いにくい

**A**: レスポンシブデザインに対応していますが、画面が小さい場合は横向きでの使用を推奨します。

---

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesまたはプルリクエストをお願いします。

---

## 📄 ライセンス

MIT License

---

## 🎓 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **データベース**: Supabase (PostgreSQL)
- **グラフ**: Chart.js
- **PDF生成**: jsPDF
- **CSV処理**: encoding-japanese
- **ホスティング**: Vercel / Cloudflare Pages

---

## 🔄 今後の改善予定

- [ ] PDF生成機能の完全実装
- [ ] 明細入力の改善
- [ ] 見積書→請求書変換の実装
- [ ] ユーザー認証機能の追加
- [ ] データエクスポート機能の強化
- [ ] 他の銀行CSVフォーマット対応
- [ ] モバイルアプリ版の開発

---

**最終更新日**: 2025年12月16日
