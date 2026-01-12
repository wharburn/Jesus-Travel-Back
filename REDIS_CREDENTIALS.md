# Upstash Redis Credentials

## Current Configuration (Updated: 2026-01-12)

### Redis Instance
- **URL**: `https://heroic-chamois-59068.upstash.io`
- **Token**: `Aua8AAIgcDFbVXyjEBI7x5K6ODX4SpoeZztwQRRvPAzBpPYGKkGjeA`
- **Status**: ✅ Connected and working

### Vector Instance
- **URL**: `https://next-tuna-49434-eu1-vector.upstash.io`
- **Token**: `ABMFMG5leHQtdHVuYS00OTQzNC1ldTFhZG1pbk5HRXdPRFppWkdFdFlqSTJOUzAwTVRnekxXSTVOVEl0WXpZek9XUmpPVFZoTlRRNA==`
- **Status**: ✅ Connected

### Search Instance
- **URL**: `https://live-wildcat-28816-eu1-search.upstash.io`
- **Token**: `ABYFMGxpdmUtd2lsZGNhdC0yODgxNi1ldTFhZG1pbk5qYzJOV0kzWWpndFlXSm1PQzAwTkRVeUxXRm1PV1l0WmpObU9HVXlNVEpoTW1ZNQ==`
- **Status**: ⚠️ Disabled (optional)

## Previous Instance (Deprecated)
- **URL**: `https://light-pika-5042.upstash.io` ❌ No longer exists
- **Issue**: DNS NXDOMAIN - instance was deleted or expired

## Testing Connection

```bash
# Test Redis
curl -s https://heroic-chamois-59068.upstash.io/ping \
  -H "Authorization: Bearer Aua8AAIgcDFbVXyjEBI7x5K6ODX4SpoeZztwQRRvPAzBpPYGKkGjeA"
# Expected: {"result":"PONG"}

# Test API Health
curl -s http://localhost:3000/api/v1/health | jq .
# Expected: redis: "connected"
```

## Important Notes

1. **Never commit `.env` file** - It's in `.gitignore` for security
2. **Update production** - Remember to update Render deployment with new credentials
3. **Fallback storage** - App now has in-memory fallback if Redis fails
4. **Backup credentials** - Store these securely (password manager, etc.)

## Updating Credentials

To update in local development:
1. Edit `backend/.env`
2. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Restart server: `npm start`

To update in production (Render):
1. Go to Render Dashboard
2. Select your service
3. Go to Environment tab
4. Update the two Redis variables
5. Save (will auto-redeploy)

