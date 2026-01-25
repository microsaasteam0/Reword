# Deploy SnippetStream API to Vercel

## Quick Deployment Steps

### 1. Clean Previous Deployment
```bash
# Remove any existing Vercel configuration
rm -rf .vercel
```

### 2. Deploy with Minimal Configuration
```bash
# Deploy to Vercel
vercel --prod

# When prompted:
# - Project name: snippetstream-api
# - Directory: ./
# - Override settings: No
```

### 3. Set Environment Variables
After deployment, set these environment variables in Vercel dashboard:

```
DODO_WEBHOOK_SECRET=your_webhook_secret_here
```

### 4. Get Your Webhook URL
Your webhook URL will be: `https://your-project.vercel.app/api/v1/payment/webhook`

### 5. Configure Dodo Payments Dashboard
1. Go to your Dodo Payments dashboard
2. Navigate to Webhooks section
3. Add webhook URL: `https://your-project.vercel.app/api/v1/payment/webhook`
4. Select events: `subscription.active`, `subscription.updated`, `subscription.renewed`, `subscription.cancelled`, `payment.completed`
5. Save the webhook secret and add it to Vercel environment variables

## Testing the Deployment

### Test Health Endpoint
```bash
curl https://your-project.vercel.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "webhook-api"
}
```

### Test Webhook Endpoint
```bash
curl -X POST https://your-project.vercel.app/api/v1/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {}}'
```

## Troubleshooting

### If deployment fails:
1. Check that `vercel.json` is properly configured
2. Ensure `requirements-minimal.txt` has minimal dependencies
3. Check Vercel function logs for errors

### If webhooks aren't received:
1. Verify webhook URL is correctly configured in Dodo Payments
2. Check Vercel function logs
3. Test webhook endpoint manually

## Files Used for Deployment
- `vercel.json` - Vercel configuration
- `api/minimal.py` - Minimal FastAPI app with webhook handling
- `requirements-minimal.txt` - Minimal Python dependencies