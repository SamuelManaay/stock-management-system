-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('Laborer', 'General construction laborer'),
  ('Foreman', 'Site foreman and supervisor'),
  ('Engineer', 'Construction engineer'),
  ('Supervisor', 'Project supervisor'),
  ('Admin', 'Administrative staff'),
  ('Operator', 'Equipment operator'),
  ('Electrician', 'Licensed electrician'),
  ('Plumber', 'Licensed plumber'),
  ('Carpenter', 'Skilled carpenter'),
  ('Mason', 'Skilled mason')
ON CONFLICT (name) DO NOTHING;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();

-- Disable RLS for roles table
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;

-- Insert sample projects if projects table exists and is empty
INSERT INTO projects (name, description, location, status, start_date) VALUES
  ('Downtown Office Building', 'Construction of 10-story office building', 'Downtown District', 'active', CURRENT_DATE),
  ('Residential Complex Phase 1', '50-unit residential development', 'North Suburb', 'active', CURRENT_DATE),
  ('Highway Bridge Repair', 'Bridge maintenance and repair project', 'Highway 101', 'active', CURRENT_DATE)
ON CONFLICT DO NOTHING;
