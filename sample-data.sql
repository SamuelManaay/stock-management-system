-- Sample seed data for Construction Management System

-- Insert admin user (Note: In production, create through Supabase Auth UI)
-- This is a reference for the admin user structure
-- Email: samsam@admin.com, Password: samsam
-- After creating user through Supabase Auth, update the users table:
-- INSERT INTO public.users (id, email, role) VALUES 
-- ('admin-user-uuid-from-auth', 'samsam@admin.com', 'admin');

-- Insert sample projects
INSERT INTO public.projects (name, description, location, start_date, end_date, status) VALUES
('Downtown Office Building', 'Construction of 15-story office building', '123 Main St, Downtown', '2024-01-01', '2024-12-31', 'active'),
('Residential Complex Phase 1', 'Construction of 50-unit residential complex', '456 Oak Ave, Suburbs', '2024-02-01', '2025-01-31', 'active'),
('Highway Bridge Repair', 'Repair and maintenance of highway bridge', 'Highway 101, Mile 25', '2024-03-01', '2024-06-30', 'active');

-- Insert sample users (these would typically be created through Supabase Auth)
-- Note: In production, users are created through the authentication system
-- This is just for reference of the expected user structure

-- Insert sample employees
INSERT INTO public.employees (employee_code, full_name, role, daily_rate, hourly_rate, employment_type, status, project_id) VALUES
('EMP001', 'John Smith', 'Foreman', 150.00, 18.75, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('EMP002', 'Maria Garcia', 'Laborer', 120.00, 15.00, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('EMP003', 'Robert Johnson', 'Engineer', 200.00, 25.00, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('EMP004', 'Sarah Wilson', 'Electrician', 160.00, 20.00, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('EMP005', 'Michael Brown', 'Operator', 140.00, 17.50, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Highway Bridge Repair' LIMIT 1)),
('EMP006', 'Lisa Davis', 'Supervisor', 180.00, 22.50, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Highway Bridge Repair' LIMIT 1)),
('EMP007', 'David Miller', 'Carpenter', 135.00, 16.88, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('EMP008', 'Jennifer Taylor', 'Mason', 130.00, 16.25, 'daily', 'active', (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1));

-- Insert sample inventory items
INSERT INTO public.inventory_items (item_code, name, category, unit, current_quantity, minimum_quantity, unit_cost, project_id) VALUES
-- Materials
('MAT001', 'Portland Cement', 'materials', 'bags', 500, 100, 12.50, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('MAT002', 'Steel Rebar #4', 'materials', 'pcs', 200, 50, 8.75, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('MAT003', 'Concrete Blocks', 'materials', 'pcs', 1000, 200, 2.25, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('MAT004', 'Lumber 2x4x8', 'materials', 'pcs', 300, 75, 6.50, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('MAT005', 'Roofing Tiles', 'materials', 'sqft', 2000, 500, 3.75, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),

-- Tools
('TOOL001', 'Power Drill', 'tools', 'pcs', 15, 5, 85.00, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('TOOL002', 'Circular Saw', 'tools', 'pcs', 8, 3, 120.00, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('TOOL003', 'Hammer', 'tools', 'pcs', 25, 10, 15.00, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('TOOL004', 'Level 4ft', 'tools', 'pcs', 12, 5, 35.00, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('TOOL005', 'Measuring Tape', 'tools', 'pcs', 20, 8, 12.00, (SELECT id FROM projects WHERE name = 'Highway Bridge Repair' LIMIT 1)),

-- Equipment
('EQ001', 'Concrete Mixer', 'equipment', 'pcs', 3, 1, 1500.00, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('EQ002', 'Excavator', 'equipment', 'pcs', 2, 1, 45000.00, (SELECT id FROM projects WHERE name = 'Highway Bridge Repair' LIMIT 1)),
('EQ003', 'Generator 5KW', 'equipment', 'pcs', 4, 2, 800.00, (SELECT id FROM projects WHERE name = 'Residential Complex Phase 1' LIMIT 1)),
('EQ004', 'Scaffolding Set', 'equipment', 'sets', 10, 3, 250.00, (SELECT id FROM projects WHERE name = 'Downtown Office Building' LIMIT 1)),
('EQ005', 'Welding Machine', 'equipment', 'pcs', 2, 1, 650.00, (SELECT id FROM projects WHERE name = 'Highway Bridge Repair' LIMIT 1));

-- Insert sample attendance records (last 7 days)
INSERT INTO public.attendance_logs (employee_id, project_id, attendance_date, time_in, time_out, attendance_type, total_hours, overtime_hours) VALUES
-- Recent attendance for multiple employees
((SELECT id FROM employees WHERE employee_code = 'EMP001'), (SELECT project_id FROM employees WHERE employee_code = 'EMP001'), CURRENT_DATE - INTERVAL '1 day', '07:00:00', '16:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP002'), (SELECT project_id FROM employees WHERE employee_code = 'EMP002'), CURRENT_DATE - INTERVAL '1 day', '07:00:00', '17:00:00', 'regular', 9.0, 1.0),
((SELECT id FROM employees WHERE employee_code = 'EMP003'), (SELECT project_id FROM employees WHERE employee_code = 'EMP003'), CURRENT_DATE - INTERVAL '1 day', '08:00:00', '17:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP004'), (SELECT project_id FROM employees WHERE employee_code = 'EMP004'), CURRENT_DATE - INTERVAL '1 day', '07:30:00', '16:30:00', 'regular', 8.0, 0.0),

((SELECT id FROM employees WHERE employee_code = 'EMP001'), (SELECT project_id FROM employees WHERE employee_code = 'EMP001'), CURRENT_DATE - INTERVAL '2 days', '07:00:00', '16:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP002'), (SELECT project_id FROM employees WHERE employee_code = 'EMP002'), CURRENT_DATE - INTERVAL '2 days', '07:00:00', '16:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP003'), (SELECT project_id FROM employees WHERE employee_code = 'EMP003'), CURRENT_DATE - INTERVAL '2 days', '08:00:00', '18:00:00', 'regular', 9.0, 1.0),

((SELECT id FROM employees WHERE employee_code = 'EMP001'), (SELECT project_id FROM employees WHERE employee_code = 'EMP001'), CURRENT_DATE - INTERVAL '3 days', '07:00:00', '16:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP002'), (SELECT project_id FROM employees WHERE employee_code = 'EMP002'), CURRENT_DATE - INTERVAL '3 days', '07:00:00', '16:00:00', 'regular', 8.0, 0.0),
((SELECT id FROM employees WHERE employee_code = 'EMP004'), (SELECT project_id FROM employees WHERE employee_code = 'EMP004'), CURRENT_DATE - INTERVAL '3 days', '07:30:00', '16:30:00', 'regular', 8.0, 0.0);

-- Insert sample inventory logs
INSERT INTO public.inventory_logs (item_id, transaction_type, quantity, reference_number, notes, transaction_date) VALUES
((SELECT id FROM inventory_items WHERE item_code = 'MAT001'), 'in', 100, 'PO-2024-001', 'Initial stock delivery', CURRENT_DATE - INTERVAL '5 days'),
((SELECT id FROM inventory_items WHERE item_code = 'MAT002'), 'in', 50, 'PO-2024-002', 'Steel rebar delivery', CURRENT_DATE - INTERVAL '4 days'),
((SELECT id FROM inventory_items WHERE item_code = 'MAT001'), 'out', 25, 'WO-2024-001', 'Used for foundation work', CURRENT_DATE - INTERVAL '3 days'),
((SELECT id FROM inventory_items WHERE item_code = 'TOOL001'), 'in', 5, 'PO-2024-003', 'New power drills', CURRENT_DATE - INTERVAL '2 days'),
((SELECT id FROM inventory_items WHERE item_code = 'MAT002'), 'out', 10, 'WO-2024-002', 'Used for column reinforcement', CURRENT_DATE - INTERVAL '1 day');

-- Insert sample cash advances
INSERT INTO public.cash_advances (employee_id, amount, date_requested, status, notes) VALUES
((SELECT id FROM employees WHERE employee_code = 'EMP002'), 500.00, CURRENT_DATE - INTERVAL '3 days', 'approved', 'Emergency medical expense'),
((SELECT id FROM employees WHERE employee_code = 'EMP004'), 300.00, CURRENT_DATE - INTERVAL '2 days', 'approved', 'Transportation allowance'),
((SELECT id FROM employees WHERE employee_code = 'EMP007'), 200.00, CURRENT_DATE - INTERVAL '1 day', 'pending', 'Tool purchase reimbursement');