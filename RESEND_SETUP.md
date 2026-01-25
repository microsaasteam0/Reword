# Resend Email Setup Guide

## ✅ What Changed

Replaced SMTP email sending with **Resend API** to fix Railway network issues.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Resend API Key

1. Go to https://resend.com/signup
2. Sign up (takes 30 seconds)
3. Go to **API Keys** in dashboard
4. Click **Create API Key**
5. Copy the key (starts with `re_`)

### Step 2: Add to Railway Environment Variables

In Railway dashboard, add these variables:

```bash
RESEND_API_KEY=re_e3WpqZht_585j3dybiDV6JN8PPXzSiAiH
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_TO_EMAIL=business@entrext.in
```

**Important Notes:**
- `RESEND_FROM_EMAIL`: Use `onboarding@resend.dev` (Resend's default) OR verify your own domain
- `RESEND_TO_EMAIL`: Where support emails will be sent (your inbox)

### Step 3: Deploy

```bash
cd backend
git add .
git commit -m "Switch to Resend for email sending"
git push
```

Railway will auto-deploy!

---

## 📧 How It Works

When a user submits a support request:

1. **User fills form** with their email and message
2. **Email sent via Resend** to `business@entrext.in`
3. **You receive email** with:
   - User's email in the body
   - User's message
   - **Reply-To** set to user's email (you can reply directly!)

**Example email you'll receive:**

```
From: onboarding@resend.dev
To: business@entrext.in
Reply-To: customer@example.com
Subject: SnippetStream Support Request from customer@example.com

New Support Request
From: customer@example.com
Time: 2026-01-25 13:47:00

Message:
I need help with my account...

Please reply directly to this email to respond to the user at: customer@example.com
```

---

## 🎯 Using Your Own Email Domain (Optional)

If you want to send from `mohit@entrext.in` instead of `onboarding@resend.dev`:

### Option 1: Single Sender Verification (Easy)
1. In Resend dashboard, go to **Domains** → **Add Domain**
2. Click **Verify Single Sender**
3. Enter `mohit@entrext.in`
4. Check your email and click verification link
5. Update Railway: `RESEND_FROM_EMAIL=mohit@entrext.in`

### Option 2: Domain Verification (Advanced)
1. Add `entrext.in` domain in Resend
2. Add DNS records (CNAME, TXT) to your domain
3. Wait for verification (24-48 hours)
4. Send from any `@entrext.in` email

---

## 🧪 Testing Locally

1. **Add to `.env` file:**
```bash
RESEND_API_KEY=re_e3WpqZht_585j3dybiDV6JN8PPXzSiAiH
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_TO_EMAIL=business@entrext.in
```

2. **Install resend:**
```bash
pip install resend
```

3. **Run backend:**
```bash
python start-backend.py
```

4. **Test support form** and check your inbox!

---

## ✅ Benefits Over SMTP

| Feature | SMTP | Resend |
|---------|------|--------|
| **Works on Railway** | ❌ Blocked | ✅ Yes |
| **Setup Time** | 10+ min | 2 min |
| **Reliability** | Medium | High |
| **Delivery Tracking** | No | Yes |
| **Free Tier** | N/A | 100/day |
| **Spam Issues** | Common | Rare |

---

## 🔍 Troubleshooting

### "Resend not installed" error
```bash
pip install resend
```

### "RESEND_API_KEY not found" warning
- Check Railway environment variables
- Make sure variable name is exactly `RESEND_API_KEY`

### Emails not arriving
1. Check Railway logs for errors
2. Verify API key is correct
3. Check spam folder
4. Verify `RESEND_TO_EMAIL` is correct

### "Invalid from email" error
- Use `onboarding@resend.dev` (always works)
- OR verify your own email/domain first

---

## 📊 Resend Dashboard

After sending emails, check Resend dashboard to see:
- ✅ Delivery status
- 📧 Email content
- 🔍 Bounce/spam reports
- 📈 Analytics

---

## 🎉 You're Done!

1. ✅ Code updated to use Resend
2. ✅ `resend` added to requirements.txt
3. ✅ Ready to push to GitHub

**Next:** Add `RESEND_API_KEY` to Railway and deploy! 🚀
