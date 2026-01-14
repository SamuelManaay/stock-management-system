-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'supervisor', 'worker');
CREATE TYPE employment_type AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE attendance_type AS ENUM ('regular', 'overtime', 'absent', 'half_day');
CREATE TYPE item_category AS ENUM ('materials', 'tools', 'equipment');
CREATE TYPE payroll_status AS ENUM ('draft', 'approved', 'paid');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'worker',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE public.employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  employee_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  daily_rate DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  employment_type employment_type DEFAULT 'daily',
  government_id_url TEXT,
  status TEXT DEFAULT 'active',
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE public.inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category item_category NOT NULL,
  unit TEXT NOT NULL,
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_quantity DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,2),
  project_id UUID REFERENCES public.projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory logs table
CREATE TABLE public.inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'in' or 'out'
  quantity DECIMAL(10,2) NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance logs table
CREATE TABLE public.attendance_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  attendance_date DATE NOT NULL,
  time_in TIME,
  time_out TIME,
  attendance_type attendance_type DEFAULT 'regular',
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Cash advances table
CREATE TABLE public.cash_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date_requested DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll table
CREATE TABLE public.payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status payroll_status DEFAULT 'draft',
  created_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Payroll items table
CREATE TABLE public.payroll_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_id UUID REFERENCES public.payroll(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  days_worked INTEGER DEFAULT 0,
  hours_worked DECIMAL(6,2) DEFAULT 0,
  overtime_hours DECIMAL(6,2) DEFAULT 0,
  gross_pay DECIMAL(10,2) NOT NULL,
  cash_advance DECIMAL(10,2) DEFAULT 0,
  other_deductions DECIMAL(10,2) DEFAULT 0,
  net_pay DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_project_id ON public.employees(project_id);
CREATE INDEX idx_inventory_items_project_id ON public.inventory_items(project_id);
CREATE INDEX idx_inventory_logs_item_id ON public.inventory_logs(item_id);
CREATE INDEX idx_inventory_logs_date ON public.inventory_logs(transaction_date);
CREATE INDEX idx_attendance_logs_employee_id ON public.attendance_logs(employee_id);
CREATE INDEX idx_attendance_logs_date ON public.attendance_logs(attendance_date);
CREATE INDEX idx_payroll_items_payroll_id ON public.payroll_items(payroll_id);
CREATE INDEX idx_payroll_items_employee_id ON public.payroll_items(employee_id);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Projects policies
CREATE POLICY "All authenticated users can view projects" ON public.projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and supervisors can manage projects" ON public.projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Employees policies
CREATE POLICY "Workers can view own employee record" ON public.employees
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Supervisors can view project employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.employees e ON e.user_id = u.id
      WHERE u.id = auth.uid() AND u.role = 'supervisor'
      AND e.project_id = employees.project_id
    )
  );

CREATE POLICY "Admins and HR can view all employees" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins and HR can manage employees" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Inventory items policies
CREATE POLICY "All authenticated users can view inventory" ON public.inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and supervisors can manage inventory" ON public.inventory_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Inventory logs policies
CREATE POLICY "All authenticated users can view inventory logs" ON public.inventory_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and supervisors can create inventory logs" ON public.inventory_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Attendance logs policies
CREATE POLICY "Workers can view own attendance" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create own attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can update own attendance" ON public.attendance_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Supervisors can view project attendance" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.employees e ON e.user_id = u.id
      WHERE u.id = auth.uid() AND u.role = 'supervisor'
      AND e.project_id = attendance_logs.project_id
    )
  );

CREATE POLICY "Admins and HR can view all attendance" ON public.attendance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Cash advances policies
CREATE POLICY "Workers can view own cash advances" ON public.cash_advances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can request cash advances" ON public.cash_advances
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and HR can manage cash advances" ON public.cash_advances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Payroll policies
CREATE POLICY "Admins and HR can manage payroll" ON public.payroll
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Payroll items policies
CREATE POLICY "Workers can view own payroll items" ON public.payroll_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and HR can manage payroll items" ON public.payroll_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON public.attendance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update inventory quantity
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transaction_type = 'in' THEN
        UPDATE public.inventory_items 
        SET current_quantity = current_quantity + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    ELSIF NEW.transaction_type = 'out' THEN
        UPDATE public.inventory_items 
        SET current_quantity = current_quantity - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_on_log AFTER INSERT ON public.inventory_logs
    FOR EACH ROW EXECUTE FUNCTION update_inventory_quantity();