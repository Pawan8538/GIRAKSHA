# Field Worker Invite Flow Guide

## Overview
The field worker registration requires a **pre-invitation** from a Site Admin. This prevents unauthorized registrations and ensures only invited workers can join.

---

## How It Works

### Step 1: Site Admin Sends Invite (Web App)

**Location**: `/dashboard/workers/invite` (needs to be created if not exists)

**Current Endpoint**: `POST /api/auth/invite/worker`

**Process**:
1. Site Admin enters field worker's phone number (e.g., `9876543210`)
2. System generates a 6-digit OTP (e.g., `123456`)
3. Stores invite in database with 15-minute expiration
4. **Returns OTP to admin** (displayed on screen)
5. Admin must **manually share OTP** with worker (via call/WhatsApp/SMS)

**Example Response**:
```json
{
  "success": true,
  "message": "Invitation sent to +919876543210",
  "otp": "123456"  // ← Admin must share this
}
```

---

### Step 2: Field Worker Registers (Mobile App)

**Screen**: Field Worker Registration

**Required Fields**:
- Phone Number (must match invited number)
- Name
- Password
- **OTP** (received from admin)

**Process**:
1. Worker enters phone number
2. Enters OTP code received from admin
3. System validates:
   - Phone number has active invite
   - OTP matches
   - Invite not expired (<15 minutes)
4. If valid: Creates account and auto-approves
5. If invalid: Shows error message

---

## Error Messages

### "Mobile number is not invited"

**Causes**:
1. Site Admin hasn't sent invite for this number
2. Invite expired (>15 minutes old)
3. OTP already used for registration
4. Phone number format mismatch

**Solution**:
- Contact Site Admin to send a fresh invite
- Ensure phone number format matches exactly
- Use invite within 15 minutes

---

## Temporary Workflow (Until SMS Integration)

### Site Admin (Web):
1. Go to worker management
2. Click "Invite Field Worker"
3. Enter phone: `9876543210`
4. Copy OTP from screen: `123456`
5. **Share OTP with worker** via:
   - WhatsApp message
   - Phone call
   - In-person

### Field Worker (Mobile):
1. Open mobile app
2. Tap "Register as Field Worker"
3. Enter phone: `9876543210`
4. Enter name and password
5. Enter OTP: `123456` (received from admin)
6. Submit

---

## Database Tables

### `worker_invites`
```sql
CREATE TABLE worker_invites (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  slope_id INTEGER,
  invited_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);
```

---

## Future Enhancements

1. **SMS Integration**: Auto-send OTP via SMS
2. **Invite Management UI**: List/resend/cancel invites
3. **Email Invites**: Alternative to SMS
4. **Bulk Invites**: Invite multiple workers at once
5. **QR Code**: Generate QR for instant registration

---

## Admin UI Missing Features

### Needed Pages:

#### `/dashboard/workers/invite`
- Form to enter phone number
- Button to send invite
- Display OTP after generating
- List of pending invites

#### `/dashboard/workers/pending-invites`
- Table of sent invites
- Show: Phone, OTP, Status, Expires At
- Actions: Resend, Cancel
- Filter: Active/Used/Expired

---

## Testing the Flow

### Test Invite:
```bash
curl -X POST http://localhost:4000/api/auth/invite/worker \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'
```

### Check Database:
```sql
SELECT * FROM worker_invites 
WHERE phone = '9876543210' 
AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

## Quick Fix: Better Error Message

Update error message to be more helpful:
```javascript
// In registerWorker controller
if (inviteRes.rows.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'No valid invitation found. Please contact your Site Admin to receive an invite code. Invites expire after 15 minutes.'
  });
}
```
