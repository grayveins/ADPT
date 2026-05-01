-- ============================================================================
-- Progress photos — widen pose enum and add storage bucket + RLS
-- ============================================================================
-- The progress_photos table itself was created in 20260419_fix_schema_gaps.sql.
-- This migration:
--   1. Widens the pose CHECK constraint to allow side_left / side_right
--      (Trainerize-style pose flow: front, side L, side R, back).
--   2. Creates the progress-photos storage bucket.
--   3. Adds RLS policies on storage.objects so clients write/read their own
--      folder and coaches can read photos for their active clients.
-- ============================================================================

-- 1. Widen pose enum
ALTER TABLE public.progress_photos
  DROP CONSTRAINT IF EXISTS progress_photos_pose_check;

ALTER TABLE public.progress_photos
  ADD CONSTRAINT progress_photos_pose_check
  CHECK (pose IN ('front', 'side', 'side_left', 'side_right', 'back', 'other'));

-- 2. Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS — drop existing first to allow re-runs
DO $$ BEGIN
  DROP POLICY IF EXISTS "Clients upload own progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Clients view own progress photos"   ON storage.objects;
  DROP POLICY IF EXISTS "Clients delete own progress photos" ON storage.objects;
  DROP POLICY IF EXISTS "Coaches view client progress photos" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Clients upload own progress photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients view own progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients delete own progress photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches view client progress photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT cc.client_id FROM public.coach_clients cc
      WHERE cc.coach_id = auth.uid() AND cc.status IN ('active', 'paused')
    )
  );
