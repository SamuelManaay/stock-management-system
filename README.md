# Construction Management System

A complete construction management system built with React, Supabase, and TailwindCSS. Features inventory management, attendance tracking, HRIS, and payroll computation - all using 100% free tiers and open-source tools.

## 🚀 Features

### 📦 Inventory Management
- Construction-specific categories (Materials, Tools, Equipment)
- Real-time stock tracking with automatic quantity updates
- Low stock alerts and minimum quantity management
- Barcode/manual item codes
- Daily stock logs with transaction history
- CSV export functionality
- Project-based inventory assignment

### ⏰ Attendance System
- Mobile-first clock in/out interface
- Automatic overtime calculation (>8 hours)
- Multiple attendance types (Regular, Overtime, Absent, Half-day)
- Project/site assignment tracking
- Duplicate time-in prevention
- Historical attendance records

### 👥 HRIS (Employee Management)
- Complete employee profiles with government ID upload
- Role-based access control (Admin, HR, Supervisor, Worker)
- Multiple employment types (Daily, Weekly, Monthly)
- Rate management (Daily/Hourly rates)
- Project assignment and status tracking
- Employee search and filtering

### 💰 Payroll System
- Automatic payroll generation from attendance data
- Support for daily and hourly rate calculations
- Overtime multiplier (1.5x) for hourly employees
- Cash advance deduction management
- Multiple payroll periods (Weekly, Bi-weekly, Monthly)
- CSV/Excel export with detailed breakdown
- Approval workflow with read-only approved payrolls

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Netlify (Free tier)
- **PWA**: Vite PWA Plugin

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier)
- Netlify account (free tier)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd construction-management-system
npm install
```

### 2. Supabase Setup

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and set project details
   - Wait for the project to be ready

2. **Set up the database**:
   - Go to the SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL to create all tables, policies, and functions

3. **Add sample data** (optional):
   - In the SQL Editor, copy and paste the contents of `sample-data.sql`
   - Run the SQL to populate with sample data

4. **Get your project credentials**:
   - Go to Settings > API
   - Copy your Project URL and anon public key

### 3. Environment Configuration

1. **Create environment file**:
```bash
cp .env.example .env
```

2. **Update `.env` with your Supabase credentials**:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 Authentication Setup

### Demo Accounts

The system includes role-based authentication. You'll need to create users through Supabase Auth:

1. **Go to Supabase Dashboard > Authentication > Users**
2. **Create test users**:
   - Admin: `samsam@admin.com` / `samsam`
   - HR: `hr@demo.com` / `password123`
   - Supervisor: `supervisor@demo.com` / `password123`
   - Worker: `worker@demo.com` / `password123`

3. **Set user roles**:
   - After creating users, go to Database > public > users table
   - Update the `role` column for each user accordingly

### User Roles & Permissions

- **Admin**: Full system access
- **HR**: Employee and payroll management
- **Supervisor**: Project-level access, inventory, attendance
- **Worker**: Own attendance and payroll view only

## 🚀 Deployment

### Netlify Deployment

1. **Build the project**:
```bash
npm run build
```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

3. **Environment Variables in Netlify**:
   - Go to Site settings > Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy the dist folder to your hosting provider
```

## 📱 PWA Features

The application is PWA-ready with:
- Offline capability for attendance (syncs when online)
- Installable on mobile devices
- Mobile-optimized interface
- Service worker for caching

To install on mobile:
1. Open the app in a mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow the installation steps

## 🗄️ Database Schema

### Core Tables

- **users**: User authentication and roles
- **projects**: Construction projects
- **employees**: Employee records and profiles
- **inventory_items**: Stock items and quantities
- **inventory_logs**: Stock transaction history
- **attendance_logs**: Daily time tracking
- **payroll**: Payroll periods and status
- **payroll_items**: Individual employee payroll details
- **cash_advances**: Employee advance requests

### Key Features

- **Row Level Security (RLS)**: Ensures data access based on user roles
- **Automatic triggers**: Update timestamps and inventory quantities
- **Foreign key constraints**: Maintain data integrity
- **Indexes**: Optimized for common queries

## 🔧 Configuration

### Inventory Categories

The system supports three main categories:
- **Materials**: Cement, steel, lumber, etc.
- **Tools**: Drills, hammers, saws, etc.
- **Equipment**: Excavators, generators, mixers, etc.

### Employment Types

- **Daily**: Fixed daily rate
- **Weekly**: Weekly salary
- **Monthly**: Monthly salary

### Attendance Types

- **Regular**: Standard work day
- **Overtime**: Extended hours
- **Absent**: No attendance
- **Half-day**: Partial attendance

## 📊 Reports & Exports

### Available Exports

1. **Inventory Report**: CSV with all items and quantities
2. **Attendance Report**: Daily attendance by date range
3. **Payroll Report**: Detailed payroll with deductions
4. **Employee Report**: Complete employee directory

### Export Features

- CSV format for Excel compatibility
- Date range filtering
- Project-specific reports
- Automatic file naming with timestamps

## 🔒 Security Features

### Row Level Security Policies

- Workers can only access their own records
- Supervisors can access project-level data
- HR and Admin have broader access based on role
- All policies enforce data isolation

### Data Protection

- Sensitive data encrypted at rest (Supabase)
- HTTPS-only communication
- JWT-based authentication
- No sensitive data in frontend code

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure `.env` file is in root directory
   - Restart development server after changes
   - Check variable names start with `VITE_`

2. **Database Connection Issues**:
   - Verify Supabase URL and key are correct
   - Check if RLS policies are properly set
   - Ensure user has proper role assigned

3. **Build Failures**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run build`
   - Verify all dependencies are installed

4. **Authentication Issues**:
   - Check Supabase Auth settings
   - Verify user roles in database
   - Clear browser cache and localStorage

### Performance Optimization

1. **Database Queries**:
   - Use indexes for frequently queried columns
   - Implement pagination for large datasets
   - Use select() to limit returned columns

2. **Frontend Performance**:
   - Lazy load components
   - Implement virtual scrolling for large lists
   - Use React.memo for expensive components

## 📈 Scaling Considerations

### Free Tier Limitations

**Supabase Free Tier**:
- 500MB database storage
- 2GB bandwidth per month
- 50,000 monthly active users
- 2 concurrent connections

**Netlify Free Tier**:
- 100GB bandwidth per month
- 300 build minutes per month
- Deploy from Git

### Upgrade Path

When you outgrow free tiers:
1. **Supabase Pro**: $25/month for more storage and bandwidth
2. **Netlify Pro**: $19/month for more build minutes and features
3. **Custom Domain**: Available on both platforms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Check React and Vite documentation
4. Open an issue in the repository

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core inventory management
- ✅ Attendance tracking
- ✅ Employee management
- ✅ Basic payroll

### Phase 2 (Future)
- 📱 Mobile app (React Native)
- 📊 Advanced reporting dashboard
- 🔔 Push notifications
- 📷 Barcode scanning
- 🌐 Multi-language support

### Phase 3 (Advanced)
- 🤖 AI-powered insights
- 📈 Predictive analytics
- 🔗 Third-party integrations
- 📋 Advanced project management

---

**Built with ❤️ for the construction industry**