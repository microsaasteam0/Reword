# Railway Deployment Checklist for SMTP

Use this checklist when deploying to Railway to ensure SMTP works correctly.

## ✅ Pre-Deployment Checklist

### 1. Test SMTP Locally
- [ ] Create `.env` file with SMTP credentials
- [ ] Run `python backend/test_smtp.py`
- [ ] Verify test email is received
- [ ] Confirm credentials are correct

### 2. Verify Code Changes
- [ ] `backend/routes/dev_routes.py` has `/test-smtp-network` endpoint
- [ ] `backend/Dockerfile` includes network diagnostic tools
- [ ] `backend/routes/support_routes.py` has 20s timeout
- [ ] All files committed to git

### 3. Railway Environment Variables
Set these in Railway dashboard:

- [ ] `SMTP_HOST=smtp.hostinger.com`
- [ ] `SMTP_PORT=587` (or `465` for SSL)
- [ ] `SMTP_EMAIL=mohit@entrext.in`
- [ ] `SMTP_PASSWORD=your_actual_password` ⚠️ **REQUIRED**
- [ ] `SMTP_RECEIVER=business@entrext.in`
- [ ] `SMTP_USE_SSL=false` (or `true` for port 465)
- [ ] `DODO_PAYMENTS_ENVIRONMENT=test_mode` (to enable dev endpoints)

---

## 🚀 Deployment Steps

### Step 1: Push Code to Railway
```bash
git add .
git commit -m "Add SMTP debugging and network diagnostics"
git push
```

Railway will automatically deploy.

### Step 2: Wait for Deployment
- [ ] Check Railway dashboard for deployment status
- [ ] Wait for "Deployed" status
- [ ] Note the deployment URL

### Step 3: Test Network Connectivity
```bash
# Replace with your Railway URL
curl https://your-app.railway.app/api/v1/dev/test-smtp-network
```

- [ ] Save the JSON response
- [ ] Check `summary.diagnosis` field
- [ ] Review individual test results

---

## 🔍 Interpreting Results

### ✅ All Tests Pass
```json
{
  "summary": {
    "diagnosis": "✅ All tests passed! SMTP should work correctly."
  }
}
```
**Action**: SMTP is working! Test actual support email functionality.

### ❌ DNS Resolution Failed
```json
{
  "tests": {
    "dns_resolution": {
      "status": "❌ FAILED",
      "message": "DNS resolution failed - container may not have internet access"
    }
  }
}
```
**Action**: 
1. Check Railway service network settings
2. Verify service has internet access
3. Contact Railway support

### ❌ Port Connectivity Failed
```json
{
  "tests": {
    "port_587_connectivity": {
      "status": "❌ FAILED",
      "message": "Cannot connect to port 587 - firewall or network issue"
    }
  }
}
```
**Action**:
1. Railway is blocking SMTP ports
2. Try port 465 (set `SMTP_PORT=465` and `SMTP_USE_SSL=true`)
3. If still fails, contact Railway support
4. Consider using SendGrid/Mailgun instead

### ❌ SMTP Authentication Failed
```json
{
  "tests": {
    "smtp_starttls_auth": {
      "status": "❌ AUTH_FAILED",
      "message": "SMTP credentials are incorrect"
    }
  }
}
```
**Action**:
1. Double-check `SMTP_EMAIL` in Railway
2. Double-check `SMTP_PASSWORD` in Railway
3. Verify credentials work locally
4. Check if Hostinger requires app-specific passwords

---

## 🐛 Troubleshooting Steps

### If DNS Fails:
```bash
# Access Railway container
railway run bash

# Test DNS manually
nslookup smtp.hostinger.com
ping -c 3 smtp.hostinger.com
```

### If Port Connectivity Fails:
```bash
# Access Railway container
railway run bash

# Test port 587
nc -vz smtp.hostinger.com 587

# Test port 465
nc -vz smtp.hostinger.com 465

# Test other ports (to verify internet works)
nc -vz google.com 80
```

### If SMTP Auth Fails:
```bash
# Verify environment variables are set
railway variables

# Check Railway logs
railway logs
```

---

## 🔄 Alternative Solutions

If Railway blocks SMTP, use one of these alternatives:

### Option 1: SendGrid (Recommended)
1. Sign up at https://sendgrid.com
2. Get API key
3. Install: `pip install sendgrid`
4. Update code to use SendGrid API
5. Set `SENDGRID_API_KEY` in Railway

**Pros**: 
- Uses HTTP API (no SMTP ports)
- Works on all cloud platforms
- Free tier: 100 emails/day

### Option 2: Mailgun
1. Sign up at https://mailgun.com
2. Get API key
3. Install: `pip install mailgun`
4. Update code to use Mailgun API

**Pros**:
- Similar to SendGrid
- Free tier: 100 emails/day

### Option 3: AWS SES
1. Set up AWS account
2. Verify domain/email
3. Install: `pip install boto3`
4. Update code to use SES

**Pros**:
- Very cheap ($0.10 per 1000 emails)
- Highly reliable

---

## 📊 Post-Deployment Verification

### Test Actual Support Email
1. [ ] Go to your app's support/contact page
2. [ ] Submit a test support request
3. [ ] Check Railway logs for email sending status
4. [ ] Verify email received at `business@entrext.in`

### Monitor Railway Logs
```bash
railway logs --follow
```

Look for:
- `✅ Support email sent successfully`
- `❌ SMTP error:` (if failed)
- Connection timeout messages
- Authentication errors

---

## 📝 Documentation Links

- **Comprehensive Guide**: `RAILWAY_SMTP_DEBUG.md`
- **Quick Start**: `SMTP_QUICKSTART.md`
- **Changes Summary**: `CHANGES_SUMMARY.md`

---

## 🆘 Getting Help

### If Tests Fail:
1. Save the JSON output from `/test-smtp-network`
2. Check Railway logs: `railway logs`
3. Run manual tests in Railway container
4. Contact Railway support with diagnostic results

### Railway Support Template:
```
Subject: SMTP Ports Blocked on Railway

Hi Railway Support,

I'm trying to send emails via SMTP (smtp.hostinger.com:587) from my 
Railway container, but the connection is being blocked.

Diagnostic Results:
[Paste JSON from /api/v1/dev/test-smtp-network]

Could you please:
1. Confirm if outbound SMTP ports (587, 465) are allowed
2. Enable these ports for my service if they're blocked
3. Suggest alternative solutions if SMTP is not supported

Thank you!
```

---

## ✅ Final Checklist

- [ ] SMTP tested locally and works
- [ ] Code deployed to Railway
- [ ] Environment variables set in Railway
- [ ] `/test-smtp-network` endpoint called
- [ ] All diagnostic tests pass
- [ ] Actual support email tested
- [ ] Email received successfully
- [ ] Railway logs show no errors

---

**Status**: 
- [ ] ✅ SMTP Working on Railway
- [ ] ⚠️ Using Alternative Provider (SendGrid/Mailgun)
- [ ] ❌ Still Debugging

**Notes**:
_Add any Railway-specific notes or issues here_

---

Good luck! 🚀
