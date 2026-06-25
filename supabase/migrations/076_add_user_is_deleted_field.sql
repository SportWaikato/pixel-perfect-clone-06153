ALTER TABLE users
ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;

CREATE INDEX idx_users_is_deleted ON users(is_deleted);
CREATE INDEX idx_users_not_deleted ON users(school_id, house_id) WHERE is_deleted = false;
