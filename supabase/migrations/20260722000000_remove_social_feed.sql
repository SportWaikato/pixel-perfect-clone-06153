-- Remove the student photo feed feature entirely.
--
-- Rationale: student-uploaded photos surfaced to other students are an app
-- store / child-safety liability. Proof images remain as PRIVATE evidence on
-- an activity (owner + school admin verification only); nothing is shared or
-- likeable any more. The app no longer reads or writes any of these columns.

-- 1. Drop the public like RPC — no feed, nothing to like.
DROP FUNCTION IF EXISTS public.increment_feed_like(uuid);

-- 2. Drop feed columns from activities. Proof image columns are kept.
ALTER TABLE public.activities
  DROP COLUMN IF EXISTS is_shared_to_feed,
  DROP COLUMN IF EXISTS feed_approved,
  DROP COLUMN IF EXISTS feed_likes,
  DROP COLUMN IF EXISTS feed_caption;
