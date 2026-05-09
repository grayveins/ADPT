-- ─────────────────────────────────────────────────────────────────────────────
-- Meal plans storage — fix INSERT policy so coaches can upload PDFs into
-- their clients' folders.
--
-- Original policy keyed the path on auth.uid() (the uploader), which meant
-- coach-uploaded files landed in <coach_id>/... and the client SELECT policy
-- (which looks up <client_id>/...) couldn't reach them. We now allow either:
--   • self-upload to one's own folder, or
--   • coach uploading on behalf of an active client.
-- The path convention is `<client_id>/<filename>` going forward.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Coaches can upload meal plans" ON storage.objects;

CREATE POLICY "Coaches can upload meal plans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meal-plans'
    AND (
      -- Self-upload (uploader is the owner of the folder)
      (storage.foldername(name))[1] = auth.uid()::text
      -- Coach uploading into one of their active clients' folders
      OR (storage.foldername(name))[1]::uuid IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Symmetrical DELETE policy so coaches can remove plans they uploaded for a
-- client (and clients can clean up their own folder).
DROP POLICY IF EXISTS "Coaches can delete meal plans" ON storage.objects;
CREATE POLICY "Coaches can delete meal plans"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'meal-plans'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (storage.foldername(name))[1]::uuid IN (
        SELECT client_id FROM public.coach_clients
        WHERE coach_id = auth.uid() AND status = 'active'
      )
    )
  );
