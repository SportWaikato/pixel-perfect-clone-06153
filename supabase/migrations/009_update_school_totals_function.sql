-- Create function to update school totals when user kilometers change
CREATE OR REPLACE FUNCTION update_school_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update school total when user's total_kilometers changes
    IF TG_OP = 'UPDATE' AND OLD.total_kilometers != NEW.total_kilometers THEN
        -- Recalculate school total from all users in that school
        UPDATE schools 
        SET total_kilometers = (
            SELECT COALESCE(SUM(total_kilometers), 0) 
            FROM users 
            WHERE school_id = NEW.school_id
        )
        WHERE id = NEW.school_id;
    END IF;
    
    -- Handle INSERT (new user)
    IF TG_OP = 'INSERT' THEN
        UPDATE schools 
        SET total_kilometers = (
            SELECT COALESCE(SUM(total_kilometers), 0) 
            FROM users 
            WHERE school_id = NEW.school_id
        )
        WHERE id = NEW.school_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update school totals
DROP TRIGGER IF EXISTS trigger_update_school_totals ON users;
CREATE TRIGGER trigger_update_school_totals
    AFTER INSERT OR UPDATE OF total_kilometers ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_school_totals();

-- Also create function to update house totals
CREATE OR REPLACE FUNCTION update_house_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update house total when user's total_kilometers changes
    IF TG_OP = 'UPDATE' AND OLD.total_kilometers != NEW.total_kilometers THEN
        -- Recalculate house total from all users in that house
        UPDATE houses 
        SET total_kilometers = (
            SELECT COALESCE(SUM(total_kilometers), 0) 
            FROM users 
            WHERE house_id = NEW.house_id
        )
        WHERE id = NEW.house_id;
    END IF;
    
    -- Handle INSERT (new user)
    IF TG_OP = 'INSERT' AND NEW.house_id IS NOT NULL THEN
        UPDATE houses 
        SET total_kilometers = (
            SELECT COALESCE(SUM(total_kilometers), 0) 
            FROM users 
            WHERE house_id = NEW.house_id
        )
        WHERE id = NEW.house_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for house totals
DROP TRIGGER IF EXISTS trigger_update_house_totals ON users;
CREATE TRIGGER trigger_update_house_totals
    AFTER INSERT OR UPDATE OF total_kilometers ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_house_totals();


-- Manual recalculation functions for one-time fixes
CREATE OR REPLACE FUNCTION recalculate_school_totals()
RETURNS void AS $$
BEGIN
    UPDATE schools 
    SET total_kilometers = (
        SELECT COALESCE(SUM(u.total_kilometers), 0) 
        FROM users u 
        WHERE u.school_id = schools.id
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_house_totals()
RETURNS void AS $$
BEGIN
    UPDATE houses 
    SET total_kilometers = (
        SELECT COALESCE(SUM(u.total_kilometers), 0) 
        FROM users u 
        WHERE u.house_id = houses.id
    );
END;
$$ LANGUAGE plpgsql; 