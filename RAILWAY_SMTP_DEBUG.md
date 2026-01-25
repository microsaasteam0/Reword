# Railway SMTP Debugging Guide

This guide helps you diagnose and fix SMTP connectivity issues on Railway + Docker.

## 🚨 Problem
Your container can't send emails via SMTP (smtp.hostinger.com). This is usually a **network/firewall issue**, not an email configuration problem.

---

## ✅ Step 1: Use the Built-in Diagnostic Endpoint

We've added a comprehensive network diagnostic endpoint to help identify the issue.

### How to Use:

1. **Deploy your app to Railway** (or run locally in Docker)

2. **Call the diagnostic endpoint**:
   ```bash
   curl https://your-railway-app.railway.app/api/v1/dev/test-smtp-network
   ```

3. **Review the results**:
   - ✅ **All tests passed**: SMTP should work fine
   - ❌ **DNS resolution failed**: Container has no internet access
   - ❌ **Port connectivity failed**: Railway firewall is blocking SMTP ports
   - ❌ **SMTP auth failed**: Your credentials are wrong (but network is OK)

### Example Response:
```json
{
  "timestamp": "2026-01-25T03:10:00",
  "environment": "test_mode",
  "tests": {
    "dns_resolution": {
      "status": "✅ SUCCESS",
      "host": "smtp.hostinger.com",
      "ip_address": "185.201.11.111",
      "message": "Successfully resolved smtp.hostinger.com to 185.201.11.111"
    },
    "port_587_connectivity": {
      "status": "✅ SUCCESS",
      "host": "smtp.hostinger.com",
      "port": 587,
      "message": "Successfully connected to smtp.hostinger.com:587"
    },
    "smtp_starttls_auth": {
      "status": "✅ SUCCESS",
      "message": "SMTP authentication successful with STARTTLS"
    }
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

## 🔧 Step 2: Manual Network Tests (If Needed)

If the diagnostic endpoint isn't available, you can manually test from inside the Railway container.

### Access Railway Container Shell:

Using Railway CLI:
```bash
railway run bash
```

Or use Railway's web console to open a shell.

### Test 1: DNS Resolution
```bash
nslookup smtp.hostinger.com
# or
ping -c 3 smtp.hostinger.com
```

**Expected**: Should resolve to an IP address (e.g., 185.201.11.111)

**If it fails**: Container has no internet access or DNS is blocked.

### Test 2: Port Connectivity (Port 587)
```bash
nc -vz smtp.hostinger.com 587
```

**Expected**: `Connection to smtp.hostinger.com 587 port [tcp/submission] succeeded!`

**If it fails**: Railway firewall is blocking outbound SMTP traffic.

### Test 3: Port Connectivity (Port 465)
```bash
nc -vz smtp.hostinger.com 465
```

**Expected**: `Connection to smtp.hostinger.com 465 port [tcp/smtps] succeeded!`

**If it fails**: Railway firewall is blocking outbound SMTP traffic.

---

## 🐛 Step 3: Common Issues & Solutions

### Issue 1: DNS Resolution Fails
**Symptom**: `dns_resolution` test fails

**Cause**: Container has no internet access

**Solutions**:
1. Check Railway service network settings
2. Ensure service isn't in a private network without egress
3. Verify Railway project has internet access enabled

### Issue 2: Port Connectivity Fails
**Symptom**: `port_587_connectivity` or `port_465_connectivity` fails

**Cause**: Railway firewall blocking outbound SMTP ports

**Solutions**:
1. **Check Railway egress rules**: Some Railway plans restrict outbound ports
2. **Contact Railway support**: Ask them to allow outbound traffic on ports 587 and 465
3. **Use alternative SMTP provider**: Consider using SendGrid, Mailgun, or AWS SES (they often work better on cloud platforms)
4. **Try port 465 (SSL)**: Sometimes port 465 is less restricted than 587
   - Set `SMTP_PORT=465` and `SMTP_USE_SSL=true` in your Railway environment variables

### Issue 3: SMTP Authentication Fails
**Symptom**: `smtp_starttls_auth` fails with AUTH_FAILED

**Cause**: Wrong credentials (but network is OK!)

**Solutions**:
1. Double-check `SMTP_EMAIL` and `SMTP_PASSWORD` in Railway environment variables
2. Verify credentials work by testing locally
3. Check if Hostinger requires app-specific passwords

### Issue 4: Connection Timeout
**Symptom**: Tests timeout after 10-20 seconds

**Cause**: Railway firewall silently dropping packets

**Solutions**:
1. Same as Issue 2 (port connectivity)
2. Try alternative SMTP ports or providers

---

## 🔐 Step 4: Verify SMTP Configuration

Ensure these environment variables are set in Railway:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_EMAIL=mohit@entrext.in
SMTP_PASSWORD=your_actual_password_here
SMTP_RECEIVER=business@entrext.in
SMTP_USE_SSL=false
```

### To use SSL (Port 465) instead:
```bash
SMTP_PORT=465
SMTP_USE_SSL=true
```

---

## 📝 Step 5: Test SMTP Code Locally

Use this Python script to test SMTP locally (outside Docker):

```python
import smtplib
from email.message import EmailMessage

SMTP_HOST = "smtp.hostinger.com"
SMTP_PORT = 587
USERNAME = "mohit@entrext.in"
PASSWORD = "your_email_password"

msg = EmailMessage()
msg["From"] = USERNAME
msg["To"] = "business@entrext.in"
msg["Subject"] = "Test from Local Machine"
msg.set_content("Test email to verify SMTP credentials work")

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.set_debuglevel(1)  # Show detailed logs
        server.starttls()
        server.login(USERNAME, PASSWORD)
        server.send_message(msg)
        print("✅ Email sent successfully!")
except Exception as e:
    print(f"❌ Failed: {e}")
```

If this works locally but fails on Railway, it's definitely a Railway network issue.

---

## 🚀 Step 6: Alternative Solutions

If Railway blocks SMTP ports, consider these alternatives:

### Option 1: Use SendGrid (Recommended for Railway)
```python
# Install: pip install sendgrid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='mohit@entrext.in',
    to_emails='business@entrext.in',
    subject='Support Request',
    html_content='<strong>Message content</strong>')

sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
response = sg.send(message)
```

**Pros**: Works on all cloud platforms, no SMTP ports needed (uses HTTP API)

### Option 2: Use Mailgun
Similar to SendGrid, uses HTTP API instead of SMTP.

### Option 3: Use AWS SES
If you're on AWS or have AWS credentials.

### Option 4: Use Railway's Email Service
Check if Railway offers a built-in email service.

---

## 📊 Debugging Checklist

- [ ] Run `/api/v1/dev/test-smtp-network` endpoint
- [ ] Check DNS resolution works
- [ ] Check port 587 connectivity
- [ ] Check port 465 connectivity
- [ ] Verify SMTP credentials are correct
- [ ] Test SMTP locally (outside Docker)
- [ ] Check Railway egress/firewall rules
- [ ] Contact Railway support if ports are blocked
- [ ] Consider alternative email providers (SendGrid, Mailgun)

---

## 🆘 Need Help?

1. **Run the diagnostic endpoint** and share the JSON output
2. **Check Railway logs** for specific error messages
3. **Contact Railway support** with the diagnostic results
4. **Share your Dockerfile** (redact secrets) for review

---

## 📚 Additional Resources

- [Railway Networking Docs](https://docs.railway.app/reference/networking)
- [Hostinger SMTP Settings](https://support.hostinger.com/en/articles/1583288-how-to-use-smtp)
- [SendGrid Python Quickstart](https://docs.sendgrid.com/for-developers/sending-email/quickstart-python)
- [Python smtplib Documentation](https://docs.python.org/3/library/smtplib.html)

---

## 🎯 Quick Summary

**Most likely cause**: Railway firewall blocking outbound SMTP ports (587/465)

**Quick fix**: 
1. Run diagnostic endpoint: `/api/v1/dev/test-smtp-network`
2. If ports are blocked, contact Railway support or use SendGrid/Mailgun instead
3. If credentials are wrong, update Railway environment variables

**Remember**: This is almost always a network/firewall issue, not a code issue!
