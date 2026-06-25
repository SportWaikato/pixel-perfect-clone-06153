-- Migration: Add super admin invite system
-- Super admins can generate invite tokens tied to an email address.
-- The recipient visits /invite/[token] to register with the super_admin role.
-- No email delivery required — the URL is shared manually.

CREATE TABLE super_admin_invites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token      UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  email      VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at    TIMESTAMPTZ NULL,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE super_admin_invites IS 'Invite tokens for onboarding new super admins without email delivery.';

-- Indexes
CREATE INDEX idx_super_admin_invites_token      ON super_admin_invites(token);
CREATE INDEX idx_super_admin_invites_created_by ON super_admin_invites(created_by);

-- RLS
ALTER TABLE super_admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage invites" ON super_admin_invites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
  );

-- RPC: look up an invite by token without requiring authentication.
-- Returns one row if found, zero rows if not.
CREATE OR REPLACE FUNCTION get_super_admin_invite(p_token UUID)
RETURNS TABLE(id UUID, email VARCHAR, expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.email, i.expires_at, i.used_at
  FROM super_admin_invites i
  WHERE i.token = p_token;
END;
$$;

-- RPC: mark an invite as used after successful registration.
-- Returns TRUE if the invite was updated, FALSE if it was already used or expired.
CREATE OR REPLACE FUNCTION use_super_admin_invite(p_token UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE super_admin_invites
  SET used_at = NOW(), used_by = p_user_id
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();

  RETURN FOUND;
END;
$$;
