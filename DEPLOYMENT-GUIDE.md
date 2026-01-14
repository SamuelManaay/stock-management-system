# Employee Management Updates - Deployment Guide

## Changes Made

### 1. Dynamic Roles System
- Created `roles` table in database with default construction roles
- Roles are now fetched dynamically from database instead of hardcoded
- Added Roles management page (admin only) to add/edit/delete roles

### 2. Dynamic Projects System
- Projects are now managed through dedicated Projects page
- Added Projects management page (admin & HR) to add/edit/delete projects
- Projects dropdown in employee form pulls from database
- Sample projects added via SQL script

### 3. Auto-Convert Rate Calculation
- When you enter Daily Rate, Hourly Rate auto-calculates (daily ÷ 8)
- When you enter Hourly Rate, Daily Rate auto-calculates (hourly × 8)
- Both fields update in real-time

### 4. Fixed Loading Bug
- Separated `loading` state (for page load) from `submitting` state (for form submission)
- Modal no longer freezes when alt-tabbing during form submission
- Form remains responsive during save operations

### 5. Sorted Dropdowns
- Roles dropdown sorted alphabetically
- Projects dropdown sorted alphabetically

## Deployment Steps

### Step 1: Run SQL Script in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `cinygojpniexsrdobwwg`
3. Go to **SQL Editor**
4. Copy and paste the contents of `add-roles-table.sql`
5. Click **Run** to execute

This will:
- Create the `roles` table
- Insert 10 default construction roles
- Insert 3 sample projects
- Set up triggers for auto-updating timestamps
- Disable RLS for public access

### Step 2: Deploy to Netlify

#### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add dynamic roles, auto-rate conversion, fix loading bug"
git push origin main
```
Netlify will auto-deploy from your Git repository.

#### Option B: Manual Deploy
```bash
npm run build
```
Then drag the `dist` folder to Netlify dashboard.

### Step 3: Verify Environment Variables in Netlify

Make sure these are set in Netlify:
- `VITE_SUPABASE_URL`: https://cinygojpniexsrdobwwg.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (your anon key)

## New Features

### Roles Management (Admin Only)
- Access via sidebar: **Roles** menu item
- Add new roles with name and description
- Edit existing roles
- Activate/deactivate roles
- Delete unused roles

### Projects Management (Admin & HR)
- Access via sidebar: **Projects** menu item
- Add new projects with name, description, location
- Set project status (Active, Completed, On Hold)
- Set start and end dates
- Edit existing projects
- Delete projects

### Employee Form Improvements
1. **Role Dropdown**: Now pulls from database, shows only active roles
2. **Project Dropdown**: Sorted alphabetically
3. **Rate Auto-Conversion**:
   - Enter $800 in Daily Rate → Hourly Rate shows $100.00
   - Enter $50 in Hourly Rate → Daily Rate shows $400.00
4. **Responsive Form**: No more freezing when switching windows

## Testing Checklist

After deployment, test:

- [ ] Login as admin (manaaysamuel@gmail.com)
- [ ] Navigate to Projects page
- [ ] Add a new project (e.g., "Mall Construction")
- [ ] Navigate to Roles page
- [ ] Add a new role (e.g., "Safety Officer")
- [ ] Go to Employees page
- [ ] Click "Add Employee"
- [ ] Verify new role appears in Role dropdown
- [ ] Verify new project appears in Project dropdown
- [ ] Enter Daily Rate (e.g., 1000) → Check Hourly Rate auto-fills (125.00)
- [ ] Clear rates, enter Hourly Rate (e.g., 50) → Check Daily Rate auto-fills (400.00)
- [ ] Alt-tab during form submission → Verify no freeze
- [ ] Submit form successfully
- [ ] Edit an employee → Verify rates display correctly

## Files Modified

1. `src/pages/Employees.jsx` - Dynamic roles/projects, auto-rate conversion, fixed loading
2. `src/pages/Roles.jsx` - NEW: Roles management page
3. `src/pages/Projects.jsx` - NEW: Projects management page
4. `src/App.jsx` - Added Roles and Projects routes
5. `src/components/Layout.jsx` - Added Roles and Projects menu items
6. `add-roles-table.sql` - Database schema for roles + sample projects

## Rollback Plan

If issues occur:
1. Remove Roles and Projects menu items from Layout.jsx
2. Revert Employees.jsx to use hardcoded roles array
3. Drop roles table: `DROP TABLE IF EXISTS roles CASCADE;`

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs in dashboard
3. Verify SQL script ran successfully
4. Confirm environment variables are set in Netlify
