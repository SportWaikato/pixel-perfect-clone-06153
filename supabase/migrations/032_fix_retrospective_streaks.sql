-- Ensure retrospective logging updates streaks properly
CREATE OR REPLACE FUNCTION update_user_streak_for_date(
  p_user_id UUID,
  p_activity_date DATE
) RETURNS void AS $$
BEGIN
  -- Recalculate the entire streak for this user
  PERFORM calculate_user_streak(p_user_id);

  -- Update the user record
  UPDATE users
  SET (current_streak, longest_streak, last_activity_date) =
    (SELECT current_streak_days, longest_streak_days, last_activity_date_calc
     FROM calculate_user_streak(p_user_id))
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger function to handle activity changes
CREATE OR REPLACE FUNCTION trigger_update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_user_streak_for_date(NEW.user_id, DATE(NEW.created_at));
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle both old and new user if user_id changed
    IF OLD.user_id != NEW.user_id THEN
      PERFORM update_user_streak_for_date(OLD.user_id, DATE(OLD.created_at));
      PERFORM update_user_streak_for_date(NEW.user_id, DATE(NEW.created_at));
    ELSE
      PERFORM update_user_streak_for_date(NEW.user_id, DATE(NEW.created_at));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_user_streak_for_date(OLD.user_id, DATE(OLD.created_at));
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_user_streak ON activities;

-- Create the trigger to fire AFTER insert, update, or delete
CREATE TRIGGER trigger_update_user_streak
AFTER INSERT OR UPDATE OR DELETE ON activities
FOR EACH ROW
EXECUTE FUNCTION trigger_update_user_streak();

-- Run a full recalculation for all users to ensure everything is up to date
SELECT recalculate_all_user_streaks();