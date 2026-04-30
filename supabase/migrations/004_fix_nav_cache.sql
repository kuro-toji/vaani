-- Fix nav_cache table: Add unique constraint on scheme_code for upsert support
-- This resolves the 409/400 errors when syncing AMFI NAV data

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'nav_cache_scheme_code_key'
  ) THEN
    ALTER TABLE nav_cache ADD CONSTRAINT nav_cache_scheme_code_key UNIQUE (scheme_code);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_nav_cache_scheme_code ON nav_cache(scheme_code);

-- Enable RLS but allow anon to read and upsert (for the frontend sync)
ALTER TABLE nav_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read nav cache (public market data)
CREATE POLICY IF NOT EXISTS "nav_cache_select_all" ON nav_cache FOR SELECT USING (true);

-- Allow anon to insert/update nav cache (for frontend sync)
CREATE POLICY IF NOT EXISTS "nav_cache_upsert_anon" ON nav_cache FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "nav_cache_update_anon" ON nav_cache FOR UPDATE USING (true) WITH CHECK (true);
