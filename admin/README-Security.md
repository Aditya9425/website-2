# Security Configuration Guide

## Environment Variables Setup

Your Supabase credentials are now secured using environment variables. Follow these steps:

### 1. Local Development

Create a `secure-config.json` file in the admin directory:

```json
{
  "SUPABASE_URL": "your_actual_supabase_url",
  "SUPABASE_ANON_KEY": "your_actual_supabase_anon_key"
}
```

**Important:** This file is already added to `.gitignore` and will not be committed to version control.

### 2. Production Deployment

For production, use one of these methods:

#### Option A: Server-side API Endpoint
Create an API endpoint `/api/config` that returns:
```json
{
  "SUPABASE_URL": "your_supabase_url",
  "SUPABASE_ANON_KEY": "your_supabase_anon_key"
}
```

#### Option B: Environment Variables (Node.js)
Set environment variables:
```bash
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
```

#### Option C: Build-time Replacement
Use a build tool to replace placeholders with actual values during deployment.

### 3. Security Best Practices

1. **Never commit credentials** to version control
2. **Use HTTPS** for all API endpoints
3. **Implement proper CORS** settings in Supabase
4. **Use Row Level Security (RLS)** in Supabase
5. **Rotate keys regularly**

### 4. Files to Keep Secure

- `secure-config.json` - Contains actual credentials
- `.env` files - Environment variables
- Any files with actual API keys

### 5. Files Safe to Commit

- `.env.example` - Template without real values
- `env-config.js` - Configuration loader (no credentials)
- `.gitignore` - Prevents accidental commits

## Current Setup

The system now:
- ✅ Loads credentials from secure sources
- ✅ Falls back gracefully if config is missing
- ✅ Prevents credentials from appearing in browser inspect
- ✅ Uses proper error handling
- ✅ Maintains all existing functionality

## Troubleshooting

If you see "Failed to initialize Supabase client":
1. Check that `secure-config.json` exists
2. Verify the credentials are correct
3. Ensure the file is properly formatted JSON
4. Check browser console for detailed error messages