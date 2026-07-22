-- SECURITY: activity proof images are children's screenshots/photos and were
-- being uploaded to the PUBLIC event-images bucket (anyone with the URL could
-- view them, unauthenticated). This creates a private bucket with storage RLS
-- scoping access to the owner, their school's admins, and super admins.
--
-- Path convention: {owner_user_id}/{timestamp}-{random}.{ext}
--
-- Legacy proofs already sitting in event-images/proofs/* should be migrated
-- or purged operationally (Storage API move), then the old prefix cleaned up.
-- New uploads no longer touch event-images.

INSERT INTO storage.buckets (id, name, public)
VALUES ('activity-proofs', 'activity-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Owner may upload only under their own folder.
DROP POLICY IF EXISTS activity_proofs_insert_own ON storage.objects;
CREATE POLICY activity_proofs_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'activity-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Read: owner, a school_admin of the owner's school, or a super admin.
DROP POLICY IF EXISTS activity_proofs_select_scoped ON storage.objects;
CREATE POLICY activity_proofs_select_scoped ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'activity-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.users me
        JOIN public.users owner
          ON owner.id::text = (storage.foldername(name))[1]
        WHERE me.id = auth.uid()
          AND (
            me.role::text = 'super_admin'
            OR (me.role::text = 'school_admin' AND me.school_id = owner.school_id)
          )
      )
    )
  );

-- Delete: owner only (admins moderate via the activity record, not the file).
DROP POLICY IF EXISTS activity_proofs_delete_own ON storage.objects;
CREATE POLICY activity_proofs_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'activity-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
