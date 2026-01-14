-- Create daily_item_logs table for liquidation tracking
CREATE TABLE IF NOT EXISTS daily_item_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code VARCHAR(100) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  action_type VARCHAR(20) NOT NULL, -- 'add', 'update', 'scan'
  scanned_by UUID REFERENCES users(id),
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_daily_item_logs_date ON daily_item_logs(log_date);
CREATE INDEX idx_daily_item_logs_item_code ON daily_item_logs(item_code);
CREATE INDEX idx_daily_item_logs_scanned_by ON daily_item_logs(scanned_by);

-- Disable RLS for daily_item_logs table
ALTER TABLE daily_item_logs DISABLE ROW LEVEL SECURITY;
