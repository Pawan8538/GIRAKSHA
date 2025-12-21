# GIRAKSHA MINE SAFETY SYSTEM - USER GUIDE

**Version**: 1.0 (Integrated System)
**Last Updated**: December 2024

## TABLE OF CONTENTS
1. System Overview
2. User Roles & Access
3. How to Use - By Role
4. Features Implemented
5. Mobile App Guide
6. Web Dashboard Guide
7. Common Tasks
8. Troubleshooting

## 1. SYSTEM OVERVIEW

GIRAKSHA is a comprehensive mine safety management system that monitors landslide risks, manages workers, and coordinates emergency responses. It combines:

- Real-time sensor monitoring
- ML-powered risk prediction
- Mobile app for field workers
- Web dashboard for admins
- Government oversight portal

**Single Mine Focus**: Tamil Nadu Limestone Mine

## 2. USER ROLES & ACCESS

**SUPER ADMIN**
- Full system control
- Create/manage mines
- Approve site admins
- View all data

**SITE ADMIN**
- Manage one mine
- Create/invite workers
- View sensors & alerts
- Assign tasks

**GOVERNMENT AUTHORITY**
- Oversight across all mines
- View alerts & reports
- Send advisories
- Monitor compliance

**FIELD WORKER**
- Mobile app access
- View tasks
- Raise SOS alerts
- Submit reports

## 3. HOW TO USE - BY ROLE

### SUPER ADMIN SETUP

**Step 1: Initial Login**
- URL: http://localhost:3000/login
- Use default super admin credentials
- Email: admin@giriaksha.com
- Password: admin123

**Step 2: Create Mine**
- Go to Dashboard > Mines
- Click "Add Mine"
- Enter: Name, Location (Lat/Lng)
- System auto-creates default sensors
- Click "Create"

**Step 3: Approve Site Admins**
- Go to Dashboard > Users
- View "Pending Approvals"
- Review site admin applications
- Click "Approve" or "Reject"

### SITE ADMIN WORKFLOW

**Step 1: Registration**
- Go to: http://localhost:3000/register/site-admin
- Fill form:
  - Name, Email, Phone
  - Select Mine from dropdown (REQUIRED)
- Upload company ID (URL)
- Submit & wait for Super Admin approval

**Step 2: After Approval - Login**
- URL: http://localhost:3000/login
- Use registered email & password

**Step 3: Add Field Workers (TWO METHODS)**

**METHOD A - Direct Creation (Fast):**
- Go to: Dashboard > Workers > Create Workers
- Enter phone numbers (one per line or comma-separated)
  - Example:
  - 9876543210
  - 9999888877
- Click "Create Worker Accounts"
- System creates accounts with:
  - Username = Phone number
  - Password = Phone number
  - Auto-approved
- Copy credentials and share with workers

**METHOD B - Invite with OTP (Secure):**
- Go to: Dashboard > Workers > Invite Worker
- Enter worker's phone number
- Click "Send Invite"
- System displays OTP (e.g., 123456)
- Share OTP with worker via WhatsApp/call
- Worker uses phone + OTP to register on mobile app

**Step 4: Manage Workers**
- Go to: Dashboard > Workers > View All
- See list of all workers
- Search by name/phone
- Delete workers if needed

**Step 5: Monitor Alerts**
- Dashboard shows recent alerts
- Go to: Dashboard > Alerts for full list
- View SOS alerts, sensor alerts, ML predictions

**Step 6: Assign Tasks**
- Go to: Dashboard > Tasks
- Create new task
- Assign to specific worker
- Worker sees task on mobile app

### GOVERNMENT AUTHORITY SETUP

**Step 1: Registration**
- URL: http://localhost:3000/register/gov-authority
- Fill form: Name, Email, Phone, Department
- Example Departments:
  - Health Ministry
  - Labor Department
  - Environmental Agency
  - Safety Board

**Step 2: Login & Monitor**
- Dashboard shows:
  - Tamil Nadu Limestone Mine status
  - Recent alerts from mine
  - Statistics
- Access:
  - ML Analytics (forecasts, heatmaps)
  - Alerts (all mine alerts)
  - Advisories (send guidance)
  - Messages (communicate with admins)

**Step 3: Send Advisory**
- Go to: Dashboard > Advisories
- Click "New Advisory"
- Select mine
- Type advisory message
- Example: "Medical team dispatched for emergency"
- Submit

**Step 4: Send Message**
- Go to: Dashboard > Messages
- Select recipient (Site Admin)
- Type message
- Send

### FIELD WORKER WORKFLOW

**Step 1A: Registration (Direct Creation Method)**
- Site Admin creates your account
- Admin shares credentials:
  - Phone: 9876543210
  - Password: 9876543210
- Download mobile app
- Login with phone as both username & password
- Change password after first login

**Step 1B: Registration (Invite Method)**
- Site Admin sends you OTP (e.g., 123456)
- Download mobile app
- Select "Register as Field Worker"
- Enter:
  - Phone number
  - OTP received from admin
  - Your name
  - Create password
- Submit - Account auto-approved

**Step 2: Daily Tasks**
- Open mobile app
- View assigned tasks
- Complete tasks
- Mark as done

**Step 3: Raise SOS Alert**
- Emergency situation detected
- Open app > Go to SOS tab
- Press "SOS" button
- Alert sent to:
  - Site Admin
  - Super Admin
  - Government Authority
- Wait for assistance

**Step 4: Mark Yourself Safe**
- After emergency resolved
- Open app > SOS tab
- Press "I am Safe" button
- Notification sent to all admins

## 4. FEATURES IMPLEMENTED

**AUTHENTICATION**
- Multi-role registration (Super Admin, Site Admin, Gov Authority, Field Worker)
- User approval workflow
- Profile management (view/edit name, phone, password)
- Session management with JWT tokens

**MINE MANAGEMENT**
- Create mines (Super Admin only)
- Auto-create default sensors with each mine
- View mine details
- Mine assignment during registration
- Single mine system (Tamil Nadu Limestone Mine)

**WORKER MANAGEMENT**
- Direct worker creation (bulk support)
- Worker invite system (OTP-based)
- List workers by mine
- Delete workers
- Worker assignment to mines

**ALERTS & NOTIFICATIONS**
- Real-time Socket.IO alerts
- SOS emergencies
- Sensor threshold alerts
- ML prediction alerts
- Browser notifications
- Alert history

**GOVERNMENT OVERSIGHT**
- Custom dashboard for gov authorities
- View mine status & alerts
- Send advisories to mine admins
- Direct messaging
- Access to ML analytics

**ML & ANALYTICS**
- 72-hour risk forecasting
- Crack detection (image upload)
- Heatmap visualization
- Evacuation route planning
- Manual risk prediction
- Real-time risk calculation

**MOBILE APP (Field Workers)**
- Task management
- SOS alerts
- "I am safe" notifications
- View assigned mine
- Real-time updates

## 5. MOBILE APP GUIDE

**INSTALLATION**
1. Android: Install APK
2. iOS: Install via TestFlight

**FIRST TIME SETUP**
1. Open app
2. Register or Login
3. Allow notifications permission
4. App loads home screen

**HOME SCREEN**
- View current risk level
- Quick access to:
  - Tasks
  - Alerts
  - SOS
  - Map

**TASKS TAB**
- See assigned tasks
- Task details
- Mark complete
- Add notes

**SOS TAB**
- Emergency button
- One-tap SOS alert
- "I am safe" button
- Emergency contacts

**MAP TAB**
- View mine location
- See sensor locations
- Risk heatmap overlay
- Your current location

**ALERTS TAB**
- Recent alerts
- Alert severity (Critical/High/Medium/Low)
- Alert timestamps

**PROFILE TAB**
- View/edit profile
- Change password
- Logout

## 6. WEB DASHBOARD GUIDE

**URL**: http://localhost:3000

**SUPER ADMIN DASHBOARD**
- Overview cards: Users, Mines, Alerts, Tasks
- Pending approvals
- Recent alerts
- Mine list
- Navigation:
  - Users - Manage all users
  - Mines - Create/view mines
  - ML Analytics - Forecasts, heatmaps
  - Sensors - Monitor sensor data
  - Alerts - All alerts
  - Tasks - Assign tasks

**SITE ADMIN DASHBOARD**
- Mine overview
- Workers count
- Recent alerts
- Quick actions
- Navigation:
  - Workers - Create/invite/manage
  - ML Analytics - Risk predictions
  - Sensors - View sensor readings
  - Alerts - Mine-specific alerts
  - Tasks - Assign to workers

**GOV AUTHORITY DASHBOARD**
- Mine status card
- Statistics (Total alerts, Today's alerts)
- Recent alerts from mine
- Quick actions:
  - Send Advisory
  - Send Message
  - View ML Analytics
- Navigation:
  - ML Analytics - Forecasts
  - Alerts - Mine alerts
  - Advisories - Send guidance
  - Messages - Communicate

## 7. COMMON TASKS

**TASK: Create New Worker**
1. Login as Site Admin
2. Go to Dashboard > Workers > Create Workers
3. Enter phone numbers
4. Click "Create Worker Accounts"
5. Copy credentials
6. Share with workers

**TASK: Approve Site Admin**
1. Login as Super Admin
2. Go to Dashboard > Users
3. Click "Pending Approvals" tab
4. Review application
5. Click "Approve"

**TASK: Respond to SOS Alert**
1. Alert appears on dashboard
2. View details
3. Contact field worker
4. If Gov Authority: Send advisory
5. Coordinate response

**TASK: View ML Risk Forecast**
1. Go to Dashboard > ML Analytics > Forecast
2. View 72-hour prediction
3. See risk chart
4. Download report if needed

**TASK: Check Sensor Data**
1. Go to Dashboard > Sensors
2. View live readings:
   - Displacement (mm)
   - Pore pressure (kPa)
   - Vibration (g)
3. Check thresholds
4. View sensor locations on map

## 8. TROUBLESHOOTING

**PROBLEM: Cannot login**
- Check email/password
- Site admins: Check if approved by Super Admin
- Clear browser cache and try again

**PROBLEM: Mine not showing in dropdown during registration**
- Contact Super Admin to create mine first
- Only Super Admin can create mines

**PROBLEM: Worker not receiving tasks**
- Check worker is approved and active
- Verify worker assigned to correct mine
- Check mobile app notifications enabled

**PROBLEM: Alerts not appearing**
- Check browser notifications enabled
- Verify WebSocket connection (see console)
- Check backend server running (port 5000)

**PROBLEM: Weather data not loading in mobile app**
- System uses free weather API (Open-Meteo)
- If fails, shows simulated data
- Check internet connection
- Weather updates every 15 minutes

**PROBLEM: Cannot create workers**
- Must be logged in as Site Admin
- Must be approved by Super Admin
- Check phone numbers are valid (10 digits)

## SYSTEM URLS & PORTS

- **Web Application**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:8000
- **Mobile App**: Standalone (React Native)

## CREDENTIALS (DEFAULT)

**Super Admin:**
- Email: admin@giriaksha.com
- Password: admin123

**Site Admin:** (After registration & approval)
- Your registered email & password

**Field Worker:** (After creation by admin)
- Username: Your phone number
- Password: Your phone number (change after first login)

## SUPPORT

For technical support, contact system administrator.
For feature requests, submit via admin dashboard.
