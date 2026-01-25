# SMTP Debugging Implementation Summary

## 📝 Changes Made

### 1. **Backend Development Routes** (`backend/routes/dev_routes.py`)

#### Added Imports:
- `socket` - for network connectivity testing
- `smtplib` - for SMTP testing
- `EmailMessage` - for sending test emails

#### New Endpoint: `/api/v1/dev/test-smtp-network`
A comprehensive diagnostic endpoint that performs 5 tests:

1. **DNS Resolution Test**
   - Resolves `smtp.hostinger.com` to IP address
   - Detects if container has internet access

2. **Port 587 Connectivity Test**
   - Tests TCP connection to port 587 (STARTTLS)
   - Identifies firewall blocks

3. **Port 465 Connectivity Test**
   - Tests TCP connection to port 465 (SSL)
   - Alternative port if 587 is blocked

4. **SMTP Authentication Test**
   - Tests actual SMTP login with credentials
   - Validates email/password are correct

5. **Send Test Email**
   - Sends actual test email to verify end-to-end functionality
   - Confirms everything works together

**Response Format:**
```json
{
  "timestamp": "...",
  "environment": "test_mode",
  "tests": {
    "dns_resolution": { "status": "✅ SUCCESS", ... },
    "port_587_connectivity": { "status": "✅ SUCCESS", ... },
    "port_465_connectivity": { "status": "✅ SUCCESS", ... },
    "smtp_starttls_auth": { "status": "✅ SUCCESS", ... },
    "send_test_email": { "status": "✅ SUCCESS", ... }
  },
  "summary": {
    "total_tests": 5,
    "passed": 5,
    "failed": 0,
    "diagnosis": "✅ All tests passed! SMTP should work correctly."
  }
}
```

---

### 2. **Docker Configuration** (`backend/Dockerfile`)

#### Added Network Diagnostic Tools:
- **netcat-openbsd** (`nc`) - Test port connectivity
- **iputils-ping** (`ping`) - Test basic network connectivity
- **dnsutils** (`nslookup`, `dig`) - Test DNS resolution

These tools allow manual debugging inside the Railway container:
```bash
# Test DNS
nslookup smtp.hostinger.com

# Test port connectivity
nc -vz smtp.hostinger.com 587
nc -vz smtp.hostinger.com 465

# Test basic connectivity
ping -c 3 smtp.hostinger.com
```

---

### 3. **SMTP Support Routes** (`backend/routes/support_routes.py`)

#### Improved Timeout:
- Changed SMTP timeout from **10 seconds** to **20 seconds**
- Better handles slow Railway network connections
- Reduces false timeout errors

---

### 4. **Local SMTP Test Script** (`backend/test_smtp.py`)

A standalone script to test SMTP configuration locally before deploying.

**Features:**
- Loads configuration from `.env` file
- Tests SMTP connection with detailed debug output
- Sends actual test email
- Provides specific error messages and solutions
- Supports both STARTTLS (587) and SSL (465)

**Usage:**
```bash
cd backend
python test_smtp.py
```

---

### 5. **Documentation**

#### `RAILWAY_SMTP_DEBUG.md` (Comprehensive Guide)
- Step-by-step debugging process
- Common issues and solutions
- Alternative email providers (SendGrid, Mailgun)
- Railway-specific troubleshooting
- Code examples and references

#### `SMTP_QUICKSTART.md` (Quick Reference)
- Quick start guide
- How to use each debugging tool
- Common issues table
- Environment variables checklist
- Next steps

---

## 🎯 How to Use These Changes

### Step 1: Test Locally
```bash
cd backend
python test_smtp.py
```

If this works, your SMTP credentials are correct.

### Step 2: Deploy to Railway
```bash
git add .
git commit -m "Add SMTP debugging tools"
git push
```

Railway will automatically deploy the updated code.

### Step 3: Run Diagnostics on Railway
```bash
curl https://your-app.railway.app/api/v1/dev/test-smtp-network
```

Review the JSON response to identify the issue.

### Step 4: Fix Issues

**If DNS fails:**
- Container has no internet access
- Check Railway network settings

**If port connectivity fails:**
- Railway firewall blocking SMTP
- Contact Railway support or use alternative provider

**If SMTP auth fails:**
- Wrong credentials
- Update Railway environment variables

---

## 🔧 Environment Variables Required

Ensure these are set in Railway:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_EMAIL=mohit@entrext.in
SMTP_PASSWORD=your_actual_password
SMTP_RECEIVER=business@entrext.in
SMTP_USE_SSL=false
DODO_PAYMENTS_ENVIRONMENT=test_mode  # To enable dev endpoints
```

---

## 🚀 Alternative Solutions

If Railway blocks SMTP ports, consider:

### SendGrid (Recommended)
```python
# Uses HTTP API, no SMTP ports needed
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='mohit@entrext.in',
    to_emails='business@entrext.in',
    subject='Support Request',
    html_content='<strong>Message</strong>')

sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
response = sg.send(message)
```

### Mailgun
Similar to SendGrid, uses HTTP API.

### AWS SES
If you have AWS credentials.

---

## 📊 Files Changed

| File | Changes | Purpose |
|------|---------|---------|
| `backend/routes/dev_routes.py` | Added `/test-smtp-network` endpoint | Network diagnostics |
| `backend/Dockerfile` | Added network tools | Manual debugging |
| `backend/routes/support_routes.py` | Increased timeout to 20s | Better Railway compatibility |
| `backend/test_smtp.py` | New file | Local SMTP testing |
| `RAILWAY_SMTP_DEBUG.md` | New file | Comprehensive guide |
| `SMTP_QUICKSTART.md` | New file | Quick reference |

---

## ✅ Testing Checklist

- [ ] Run `python backend/test_smtp.py` locally
- [ ] Verify local test passes
- [ ] Deploy to Railway
- [ ] Call `/api/v1/dev/test-smtp-network` endpoint
- [ ] Review diagnostic results
- [ ] Fix identified issues
- [ ] Test actual support email functionality
- [ ] Document any Railway-specific issues

---

## 🆘 If You Need Help

1. **Share the output** of `/api/v1/dev/test-smtp-network`
2. **Check Railway logs** for specific errors
3. **Run manual tests** inside Railway container
4. **Contact Railway support** with diagnostic results

---

## 🎓 Key Takeaways

1. **Network issues are common** on cloud platforms like Railway
2. **SMTP ports are often blocked** by default
3. **Use the diagnostic endpoint** to identify the exact issue
4. **Test locally first** to rule out credential problems
5. **Consider HTTP-based email APIs** (SendGrid, Mailgun) for cloud deployments

---

**Remember**: This is almost always a Railway network/firewall issue, not a code issue!
