# Barcode Scanner & Daily Logs Feature - Deployment Guide

## New Features

### 1. **Item Scanner Module**
- Camera-based barcode/QR code scanning
- Manual barcode entry option
- Automatic item detection:
  - If item exists → Update quantity
  - If item doesn't exist → Show add item form
- Real-time today's scanned items view
- Export today's logs to CSV

### 2. **Daily Liquidation Logs Module**
- View historical daily logs by date
- Statistics dashboard (Total Items, Items Added, Items Updated)
- Export to CSV or Excel format
- Date filtering for specific days
- Complete audit trail of all scanned items

## Database Changes

### New Table: `daily_item_logs`
Stores all scanned item transactions for liquidation tracking:
- Item code, name, category
- Quantity and unit
- Action type (add/update/scan)
- Scanned by (user reference)
- Log date and timestamp
- Notes field

## Deployment Steps

### Step 1: Run SQL Script

1. Go to Supabase Dashboard → SQL Editor
2. Run `add-daily-logs-table.sql`:
   - Creates `daily_item_logs` table
   - Sets up indexes for performance
   - Disables RLS for access

### Step 2: Test Locally

```bash
npm run dev
```

Test the features:
1. Login as any user (workers can access this)
2. Navigate to **Scanner** in sidebar
3. Click "Enter Barcode Manually"
4. Enter a test barcode (e.g., "TEST001")
5. If item doesn't exist, fill the add form
6. If item exists, enter quantity to add
7. Check **Daily Logs** page to see the entry
8. Export to CSV/Excel

### Step 3: Deploy to Netlify

```bash
git add .
git commit -m "Add barcode scanner and daily logs feature"
git push origin main
```

Or manual deploy:
```bash
npm run build
# Upload dist folder to Netlify
```

## How It Works

### Scanner Flow

1. **Start Scanner**
   - Click "Start Camera Scanner" (uses device camera)
   - OR click "Enter Barcode Manually"

2. **Scan/Enter Barcode**
   - Camera: Click "Capture Barcode" → Enter code in prompt
   - Manual: Type barcode → Press Enter or Submit

3. **Item Processing**
   - System checks if item exists in inventory
   - **If exists**: Prompt for quantity → Update inventory → Log action
   - **If new**: Show add form → Add to inventory → Log action

4. **View Logs**
   - Today's scans shown in table below scanner
   - Export button creates CSV with all today's data

### Daily Logs Flow

1. **Select Date**
   - Use date picker to choose any date
   - View all scans for that date

2. **View Statistics**
   - Total items scanned
   - Items added (new items)
   - Items updated (existing items)

3. **Export Data**
   - CSV: Standard comma-separated format
   - Excel: UTF-8 BOM format for Excel compatibility

## Camera Permissions

### Mobile Devices
- First time: Browser will ask for camera permission
- Grant permission to use scanner
- Uses rear camera by default (facingMode: 'environment')

### Desktop
- Uses webcam if available
- Manual entry recommended for desktop use

## Use Cases

### For Workers
1. **Receiving Materials**
   - Scan items as they arrive
   - Add new items or update quantities
   - Daily log tracks all receipts

2. **Tool Check-out**
   - Scan tools being taken to site
   - Update inventory automatically
   - Track who scanned what and when

3. **End of Day Liquidation**
   - Export daily logs
   - Submit to supervisor/admin
   - Complete audit trail

### For Admin/Supervisors
1. **Review Daily Activity**
   - Check Daily Logs page
   - Filter by date
   - Export for records

2. **Inventory Reconciliation**
   - Compare daily logs with physical count
   - Track discrepancies
   - Audit trail for accountability

## Navigation Structure

**All Users See:**
- Dashboard
- Inventory
- Attendance
- Scanner ✨ NEW
- Daily Logs ✨ NEW
- Payslip/Payroll

**Admin/HR Also See:**
- Employees
- Projects
- Roles (admin only)

## Files Created

1. `src/pages/Scanner.jsx` - Barcode scanner interface
2. `src/pages/DailyLogs.jsx` - Daily logs viewer and exporter
3. `add-daily-logs-table.sql` - Database schema

## Files Modified

1. `src/App.jsx` - Added Scanner and DailyLogs routes
2. `src/components/Layout.jsx` - Added Scanner and Daily Logs menu items

## Testing Checklist

- [ ] Run SQL script in Supabase
- [ ] Login to app
- [ ] Navigate to Scanner page
- [ ] Test manual barcode entry with new item
- [ ] Verify item added to inventory
- [ ] Check item appears in today's logs
- [ ] Test scanning existing item
- [ ] Verify quantity updated
- [ ] Export today's logs to CSV
- [ ] Navigate to Daily Logs page
- [ ] Change date filter
- [ ] Export to CSV
- [ ] Export to Excel
- [ ] Verify Excel file opens correctly

## Future Enhancements

- Integrate real barcode scanning library (e.g., `html5-qrcode`)
- Offline mode with sync when online
- Bulk scanning mode
- Photo capture for items
- Signature capture for liquidation approval
- Weekly/monthly log summaries

## Troubleshooting

### Camera Not Working
- Check browser permissions
- Try manual entry instead
- Ensure HTTPS (camera requires secure context)

### Items Not Updating
- Check Supabase connection
- Verify RLS is disabled on tables
- Check browser console for errors

### Export Not Working
- Check if logs exist for selected date
- Try different browser
- Check popup blocker settings

## Support

For issues:
1. Check browser console for errors
2. Verify database tables exist
3. Check Supabase logs
4. Ensure proper permissions granted
