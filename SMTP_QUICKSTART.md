# Quick Start: SMTP Debugging on Railway

## 🎯 What I've Added

I've implemented comprehensive SMTP debugging tools to help diagnose Railway network issues:

### 1. **Diagnostic API Endpoint** (`/api/v1/dev/test-smtp-network`)
   - Tests DNS resolution
   - Tests TCP connectivity on ports 587 and 465
   - Tests SMTP authentication
   - Sends a test email
   - Provides detailed diagnosis

### 2. **Updated Dockerfile**
   - Added network diagnostic tools: `netcat`, `ping`, `nslookup`
   - These tools help debug connectivity issues

### 3. **Local SMTP Test Script** (`backend/test_smtp.py`)
   - Test your SMTP credentials locally before deploying
   - Detailed error messages and solutions

### 4. **Improved SMTP Timeout**
   - Increased timeout from 10s to 20s for better Railway compatibility

---

## 🚀 How to Use

### Option 1: Use the API Endpoint (Recommended)

1. **Deploy to Railway** (or run locally)

2. **Call the diagnostic endpoint**:
   ```bash
   # Replace with your Railway URL
   curl https://your-app.railway.app/api/v1/dev/test-smtp-network
   ```

3. **Review the JSON response** to see what's failing

### Option 2: Test Locally First

1. **Run the test script**:
   ```bash
   cd backend
   python test_smtp.py
   ```

2. **Check the output** - if it works locally but fails on Railway, it's a Railway network issue

### Option 3: Manual Testing in Railway Container

1. **Access Railway shell**:
   ```bash
   railway run bash
   ```

2. **Test DNS**:
   ```bash
   nslookup smtp.hostinger.com
   ```

3. **Test port connectivity**:
   ```bash
   nc -vz smtp.hostinger.com 587
   nc -vz smtp.hostinger.com 465
   ```

---

## 🔍 What Each Test Means

| Test | What it checks | If it fails |
|------|---------------|-------------|
| **DNS Resolution** | Can the container resolve smtp.hostinger.com? | Container has no internet access |
| **Port 587 Connectivity** | Can the container reach port 587? | Railway firewall blocking SMTP |
| **Port 465 Connectivity** | Can the container reach port 465? | Railway firewall blocking SMTP |
| **SMTP Auth** | Are your credentials correct? | Wrong email/password |
| **Send Test Email** | Can you actually send an email? | Check previous tests |

---

## 📋 Environment Variables Needed

Make sure these are set in Railway:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_EMAIL=mohit@entrext.in
SMTP_PASSWORD=your_actual_password
SMTP_RECEIVER=business@entrext.in
SMTP_USE_SSL=false
```

**To use SSL (port 465):**
```bash
SMTP_PORT=465
SMTP_USE_SSL=true
```

---

## 🐛 Common Issues & Quick Fixes

### Issue: "DNS resolution failed"
**Fix**: Container has no internet. Check Railway network settings.

### Issue: "Port connectivity failed"
**Fix**: Railway is blocking SMTP ports. Either:
- Contact Railway support to allow ports 587/465
- Use SendGrid/Mailgun instead (HTTP API, no SMTP ports needed)

### Issue: "SMTP auth failed"
**Fix**: Wrong credentials. Double-check `SMTP_EMAIL` and `SMTP_PASSWORD`.

### Issue: "Connection timeout"
**Fix**: Same as port connectivity - Railway is blocking traffic.

---

## 🎯 Next Steps

1. **Test locally** with `python backend/test_smtp.py`
2. **Deploy to Railway** and call `/api/v1/dev/test-smtp-network`
3. **If ports are blocked**, consider using SendGrid or Mailgun
4. **If credentials are wrong**, update Railway environment variables

---

## 📚 Full Documentation

See `RAILWAY_SMTP_DEBUG.md` for comprehensive debugging guide with:
- Detailed troubleshooting steps
- Alternative email providers (SendGrid, Mailgun)
- Code examples
- Railway-specific solutions

---

## ✅ Checklist

- [ ] Test SMTP locally with `test_smtp.py`
- [ ] Deploy updated code to Railway
- [ ] Call `/api/v1/dev/test-smtp-network` endpoint
- [ ] Review diagnostic results
- [ ] Fix any issues identified
- [ ] Test sending actual support emails

---

**Remember**: 99% of the time, this is a Railway network/firewall issue, not a code issue!
