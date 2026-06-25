-- Add school_ids to promotional_assets for targeted visibility
-- Empty array = visible to all schools; non-empty = restricted to listed schools

ALTER TABLE promotional_assets
  ADD COLUMN IF NOT EXISTS school_ids UUID[] NOT NULL DEFAULT '{}';

-- Drop and recreate the school_admin/student read policy to respect school_ids
DROP POLICY IF EXISTS "Authenticated users read active promotional_assets" ON promotional_assets;

CREATE POLICY "Authenticated users read active promotional_assets"
ON promotional_assets
FOR SELECT
USING (
  is_active = true
  AND auth.uid() IN (SELECT id FROM public.users WHERE is_active = true)
  AND (
    array_length(school_ids, 1) IS NULL
    OR (SELECT school_id FROM public.users WHERE id = auth.uid()) = ANY(school_ids)
  )
);
