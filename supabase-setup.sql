-- ============================================
-- KIT工房 会計システム - Supabaseセットアップ用SQL
-- ============================================
-- 
-- 実行方法:
-- 1. Supabase Dashboard → SQL Editor を開く
-- 2. "New query" をクリック
-- 3. このファイルの内容をコピー&ペースト
-- 4. "Run" をクリック
--
-- ============================================

-- データベーステーブルの作成
-- ============================================

-- 顧客テーブル
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- サービステーブル
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  unit_price NUMERIC,
  unit TEXT,
  tax_rate NUMERIC DEFAULT 0.10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 仕訳帳テーブル
CREATE TABLE IF NOT EXISTS journal_entries (
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
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  items JSONB,
  subtotal NUMERIC,
  tax NUMERIC,
  total NUMERIC,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 見積書テーブル
CREATE TABLE IF NOT EXISTS quotations (
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

-- ============================================
-- インデックスの作成（パフォーマンス向上）
-- ============================================

CREATE INDEX IF NOT EXISTS idx_journal_entries_date 
  ON journal_entries(date DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_created 
  ON journal_entries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_customer 
  ON invoices(customer_id);

CREATE INDEX IF NOT EXISTS idx_invoices_status 
  ON invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoices_issue_date 
  ON invoices(issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_customer 
  ON quotations(customer_id);

CREATE INDEX IF NOT EXISTS idx_quotations_issue_date 
  ON quotations(issue_date DESC);

-- ============================================
-- Row Level Security (RLS) の設定
-- ============================================

-- RLSを有効化
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLSポリシーの作成（開発環境用）
-- ============================================
-- 
-- ⚠️ 注意: 以下のポリシーは開発・テスト用です
-- 本番環境では認証を実装し、適切なポリシーに変更してください
--
-- ============================================

-- 開発環境用: すべてのユーザーに読み書き権限を付与
DROP POLICY IF EXISTS "Enable all for all users" ON customers;
CREATE POLICY "Enable all for all users" ON customers 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for all users" ON services;
CREATE POLICY "Enable all for all users" ON services 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for all users" ON journal_entries;
CREATE POLICY "Enable all for all users" ON journal_entries 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for all users" ON invoices;
CREATE POLICY "Enable all for all users" ON invoices 
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for all users" ON quotations;
CREATE POLICY "Enable all for all users" ON quotations 
  FOR ALL USING (true);

-- ============================================
-- サンプルデータの挿入（オプション）
-- ============================================

-- サンプル顧客データ
INSERT INTO customers (name, company, phone, email) 
VALUES 
  ('山田太郎', '株式会社サンプル', '03-1234-5678', 'yamada@example.com'),
  ('佐藤花子', '合同会社テスト', '03-8765-4321', 'sato@example.com')
ON CONFLICT DO NOTHING;

-- サンプルサービスデータ
INSERT INTO services (name, category, unit_price, unit, tax_rate) 
VALUES 
  ('ウェブサイト制作', 'ウェブ制作', 150000, '式', 0.10),
  ('HP制作（小規模）', 'HP制作', 80000, '式', 0.10),
  ('音楽編集', '音楽編集', 30000, '曲', 0.10),
  ('動画編集', '動画編集', 50000, '本', 0.10),
  ('コンサルティング', 'コンサル', 20000, '時間', 0.10)
ON CONFLICT DO NOTHING;

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ セットアップ完了！';
  RAISE NOTICE '📊 以下のテーブルが作成されました:';
  RAISE NOTICE '   - customers (顧客)';
  RAISE NOTICE '   - services (サービス)';
  RAISE NOTICE '   - journal_entries (仕訳帳)';
  RAISE NOTICE '   - invoices (請求書)';
  RAISE NOTICE '   - quotations (見積書)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLSが有効化されました';
  RAISE NOTICE '⚠️  現在は開発環境用のポリシーです';
  RAISE NOTICE '   本番環境では認証を実装してください';
  RAISE NOTICE '';
  RAISE NOTICE '📱 次のステップ:';
  RAISE NOTICE '1. Settings → API からAPIキーを取得';
  RAISE NOTICE '2. 環境変数を設定';
  RAISE NOTICE '3. アプリケーションをデプロイ';
END $$;

-- ============================================
-- 本番環境用RLSポリシー（コメントアウト）
-- ============================================
-- 
-- 本番環境でユーザー認証を実装する場合は、
-- 以下のポリシーを有効にしてください
--
-- ============================================

/*
-- 認証されたユーザーのみアクセス可能
DROP POLICY IF EXISTS "Authenticated users only" ON customers;
CREATE POLICY "Authenticated users only" ON customers
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users only" ON services;
CREATE POLICY "Authenticated users only" ON services
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users only" ON journal_entries;
CREATE POLICY "Authenticated users only" ON journal_entries
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users only" ON invoices;
CREATE POLICY "Authenticated users only" ON invoices
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users only" ON quotations;
CREATE POLICY "Authenticated users only" ON quotations
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
*/

-- ============================================
-- ユーザー別データ分離（さらに厳格なポリシー）
-- ============================================
--
-- ユーザーごとにデータを分離する場合は、
-- 以下のようなポリシーを使用してください
--
-- ============================================

/*
-- テーブルにuser_idカラムを追加
ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE services ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE invoices ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE quotations ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- 自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own data" ON customers
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 他のテーブルも同様に設定...
*/
