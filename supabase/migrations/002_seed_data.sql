-- Insert sample schools
INSERT INTO schools (name, code, total_students, is_active) VALUES
('Waikato Primary School', 'WPS', 450, true),
('Hamilton East School', 'HES', 320, true),
('Cambridge Primary', 'CPS', 280, true),
('Te Awamutu College', 'TAC', 650, true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample houses for each school
-- Waikato Primary School houses
INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Tainui', '#FF6B6B', s.id, 0 FROM schools s WHERE s.code = 'WPS'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Ngati Tuwharetoa', '#4ECDC4', s.id, 0 FROM schools s WHERE s.code = 'WPS'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Te Arawa', '#45B7D1', s.id, 0 FROM schools s WHERE s.code = 'WPS'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Maniapoto', '#96CEB4', s.id, 0 FROM schools s WHERE s.code = 'WPS'
ON CONFLICT DO NOTHING;

-- Hamilton East School houses
INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Kupe', '#FFB74D', s.id, 0 FROM schools s WHERE s.code = 'HES'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Tawhirimatea', '#9575CD', s.id, 0 FROM schools s WHERE s.code = 'HES'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Tangaroa', '#42A5F5', s.id, 0 FROM schools s WHERE s.code = 'HES'
ON CONFLICT DO NOTHING;

INSERT INTO houses (name, color, school_id, total_points) 
SELECT 'Tane Mahuta', '#66BB6A', s.id, 0 FROM schools s WHERE s.code = 'HES'
ON CONFLICT DO NOTHING; 