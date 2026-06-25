-- Fix RLS policy on blocked_emails so school_admin role users can insert/delete.
--
-- Migration 059 used school_admins join table for the WITH CHECK, but school admins
-- are identified via users.role = 'school_admin' and users.school_id, not via that
-- join table. Super admins passed fine; school admins were rejected on INSERT/UPDATE.

DROP POLICY IF EXISTS "school_admins_manage_blocked_emails" ON blocked_emails;

CREATE POLICY "school_admins_manage_blocked_emails" ON blocked_emails
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = blocked_emails.school_id OR users.role = 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('school_admin', 'super_admin')
        AND (users.school_id = blocked_emails.school_id OR users.role = 'super_admin')
    )
  );
