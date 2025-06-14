# Production Environment Variables Setup for Vercel

This document outlines the required environment variables for deploying the Sucia MVP application to production on Vercel.

## Required Environment Variables

### 1. Supabase Configuration (Required)
```bash
# Production Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Production Supabase Anonymous Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2. Authentication Configuration (Optional)
```bash
# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_secure_nextauth_secret_here

# NextAuth URL (your production domain)
NEXTAUTH_URL=https://your-domain.com
```

### 3. Application Configuration
```bash
# Node environment
NODE_ENV=production

# Application URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Admin password (if still using legacy auth)
ADMIN_PASSWORD=your_secure_admin_password_here
```

### 4. Analytics & Monitoring (Optional)
```bash
# Google Analytics (if implemented)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry DSN (if error tracking implemented)
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id
```

### 5. Third-Party Services (Optional)
```bash
# Email service (if implemented)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# Storage/CDN (if using external storage)
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Vercel Setup Instructions

### Method 1: Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate value
4. Select the appropriate environments (Production, Preview, Development)
5. Save and redeploy your application

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set production environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Deploy with environment variables
vercel --prod
```

### Method 3: .env.production (Not Recommended for Secrets)
Create a `.env.production` file for non-sensitive variables only:
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Security Best Practices

### 1. Secret Management
- ✅ Store sensitive data (API keys, secrets) in Vercel's environment variables
- ✅ Use different keys for production vs development/preview
- ✅ Generate strong, unique secrets for production
- ❌ Never commit `.env` files with production secrets to version control

### 2. Variable Naming
- Use `NEXT_PUBLIC_` prefix only for variables that need to be accessible in the browser
- Keep server-side secrets without the `NEXT_PUBLIC_` prefix
- Use descriptive names that indicate the service/purpose

### 3. Access Control
- Limit environment variable access to necessary team members
- Regularly rotate API keys and secrets
- Monitor for any unauthorized access or changes

## Validation Checklist

Before deploying to production, ensure:

- [ ] All required environment variables are set in Vercel
- [ ] Database connection works with production Supabase instance
- [ ] Authentication flows work correctly
- [ ] No development/staging URLs are hardcoded
- [ ] All third-party service integrations are configured for production
- [ ] Error tracking and monitoring are properly configured
- [ ] Performance monitoring is enabled

## Troubleshooting

### Common Issues
1. **Build fails with environment variable errors**
   - Check that all required variables are set in Vercel
   - Verify variable names match exactly (case-sensitive)
   - Ensure no trailing spaces in variable values

2. **Runtime errors related to missing variables**
   - Check that client-side variables use `NEXT_PUBLIC_` prefix
   - Verify server-side variables are available in the correct environment

3. **Database connection issues**
   - Verify Supabase URL and key are correct for production
   - Check Supabase project settings and permissions
   - Ensure Row Level Security (RLS) is properly configured

## Environment-Specific Notes

### Production
- Use production Supabase project
- Enable all security headers and HTTPS
- Set up proper monitoring and error tracking
- Use production-ready secrets

### Preview (Staging)
- Can use staging Supabase project or production with limited permissions
- Useful for testing before production deployment
- Should mirror production configuration as closely as possible

### Development
- Use local `.env.local` file
- Can use development Supabase project
- Include additional debugging variables if needed

## Next Steps

After setting up environment variables:
1. Deploy to Vercel preview environment first
2. Test all functionality thoroughly
3. Run performance audits (Lighthouse, etc.)
4. Deploy to production
5. Monitor for any issues and set up alerts 