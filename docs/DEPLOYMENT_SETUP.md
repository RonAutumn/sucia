# Deployment Setup Guide

This guide explains how to set up the GitHub Actions CI/CD pipeline with Vercel deployments.

## Required GitHub Secrets

Add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

### Vercel Configuration
- `VERCEL_TOKEN` - Your Vercel API token (get from Vercel dashboard → Settings → Tokens)
- `VERCEL_ORG_ID` - Your Vercel organization ID (found in Vercel project settings)
- `VERCEL_PROJECT_ID` - Your Vercel project ID (found in Vercel project settings)

### Lighthouse CI (Optional)
- `LHCI_GITHUB_APP_TOKEN` - GitHub token for Lighthouse CI status checks
- `LHCI_TOKEN` - Lighthouse CI build token (if using LHCI server)

## Setup Steps

### 1. Create Vercel Project
1. Log in to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Set framework preset to "Vite"
4. Set build command to `npm run build`
5. Set output directory to `dist`
6. Deploy the project

### 2. Get Vercel Configuration Values
1. Go to your Vercel project settings
2. Copy the Project ID from the General tab
3. Copy the Team ID (Org ID) from the General tab
4. Go to your Vercel account settings → Tokens
5. Create a new token with appropriate scope

### 3. Configure GitHub Secrets
Add the following secrets to your GitHub repository:

```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here
VERCEL_PROJECT_ID=your_project_id_here
```

### 4. Application Environment Variables

If your application requires runtime environment variables (e.g., API endpoints, public keys for services), these should be configured directly within your Vercel project settings:

1.  **Navigate to Vercel:** Go to your project on Vercel.
2.  **Settings Tab:** Select the "Settings" tab.
3.  **Environment Variables:** Click on "Environment Variables" in the side menu.

Here, you can define variables and assign them to different Vercel environments:
    -   **Production:** Variables used when your site is live on its production domain(s).
    -   **Preview:** Variables used for all preview deployments (e.g., from pull requests).
    -   **Development:** Variables used when running `vercel dev` locally.

**Important for Vite Applications:**
-   To expose an environment variable to your client-side Vite application, it **must** be prefixed with `VITE_` (e.g., `VITE_API_URL`, `VITE_SENTRY_DSN`).
-   You would then access it in your code as `import.meta.env.VITE_API_URL`.
-   Non-prefixed variables are only available in serverless functions or build scripts running on Vercel, not in the client-side bundle.

**Workflow vs. Application Variables:**
-   The GitHub Secrets configured in the previous step (like `VERCEL_TOKEN`) are for the GitHub Actions workflow to authenticate and interact with services.
-   Application-specific variables (like `VITE_API_URL`) are managed in Vercel to control your application's behavior in different deployed environments.

## Workflow Features

### Pull Request Events
- ✅ Build and test validation
- ✅ Lighthouse CI performance checks (≥90 score required)
- ✅ Bundle size analysis
- ✅ Accessibility testing
- ✅ Preview deployment to unique URL
- ✅ Automated PR comment with preview link and status
- ✅ Comment updates on subsequent pushes
- ✅ Cleanup notification when PR is closed/merged

### Main Branch Push
- ✅ Build and test validation
- ✅ Bundle size analysis
- ✅ Accessibility testing
- ✅ Production deployment
- ✅ Detailed deployment notifications (includes commit SHA, triggering actor, and direct link to logs on failure)

## Security Headers

The deployment automatically includes security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

## Performance Optimization

The build includes:
- Automatic code splitting
- Asset optimization
- Gzip/Brotli compression
- Cache headers for static assets
- Bundle analysis and visualization

## Setting Up Team Notifications (Example: Slack)

The GitHub Actions workflow includes steps to send notifications for production deployment success or failure. To enable these, you'll typically use a community action or a script that posts to your team's communication platform.

**Example using `rtCamp/action-slack-notify@v2` for Slack:**

1.  **Create a Slack Incoming Webhook:**
    *   Go to your Slack app's settings or create a new app.
    *   Navigate to "Incoming Webhooks" and activate it.
    *   Click "Add New Webhook to Workspace" and select a channel.
    *   Copy the generated Webhook URL.

2.  **Add Slack Webhook URL to GitHub Secrets:**
    *   In your GitHub repository, go to `Settings` → `Secrets and variables` → `Actions`.
    *   Click `New repository secret`.
    *   Name it `SLACK_WEBHOOK_URL` and paste the Webhook URL you copied.

3.  **Uncomment and Customize in Workflow:**
    *   In `.github/workflows/deploy.yml`, locate the `Send deployment success notification` and `Send deployment failure notification` steps within the `deploy-production` job.
    *   Uncomment the example Slack notification steps (those using `rtCamp/action-slack-notify@v2`).
    *   You can customize the message, username, icon, etc., as needed.

**Example Snippet for Success Notification:**
```yaml
      - name: Send deployment success notification
        if: success()
        uses: rtCamp/action-slack-notify@v2 # Ensure this line is uncommented or replaced with your chosen action
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_USERNAME: GitHub Actions
          SLACK_ICON_EMOJI: ":rocket:"
          SLACK_COLOR: good
          SLACK_TITLE: "Production Deployment Successful!"
          SLACK_MESSAGE: "🚀 Production deployment to $(cat deployment-url.txt) was successful!"
          SLACK_FOOTER: "Commit by ${{ github.actor }} | SHA: ${{ github.sha }}"
```

Refer to the documentation of your chosen notification action for more advanced customization.

## Rollback Procedures

Vercel maintains a history of all your deployments, making rollbacks straightforward.

**Manual Rollback via Vercel Dashboard:**

1.  **Go to your Project:** Log in to your Vercel account and navigate to the project.
2.  **Deployments Tab:** Go to the "Deployments" tab. You'll see a list of all deployments, with the current production deployment highlighted.
3.  **Find Previous Deployment:** Identify a previous, stable deployment you want to roll back to.
4.  **Redeploy:** Click the three-dots menu (...) next to that deployment and select "Redeploy to Production."
    *   Alternatively, you can copy the `Deployment URL` of the old deployment and use the Vercel CLI: `vercel alias set <old-deployment-url> <your-production-domain.com> --token=${{ secrets.VERCEL_TOKEN }} --scope=${{ secrets.VERCEL_ORG_ID }}`.

Vercel will instantly switch your production domain to point to the selected older deployment.

**Automated Rollbacks (Future Enhancement):**

While not implemented in the current workflow, GitHub Actions could be scripted to:
1.  Detect a failed production deployment.
2.  Fetch a list of previous successful Vercel deployments.
3.  Automatically re-alias the production domain to the last known good deployment using the Vercel CLI.
This would require additional scripting and logic within the GitHub Actions workflow.

## Integrating Monitoring & Error Tracking (Example: Sentry)

This project is configured to integrate with Sentry for error tracking and performance monitoring. You'll need to set up a Sentry account and configure the necessary environment variables.

**1. Sentry Account & Project Setup:**
   - Create an account at [Sentry.io](https://sentry.io).
   - Create a new Sentry project, selecting "React" as the platform.
   - Once the project is created, Sentry will provide you with a DSN (Data Source Name). This is crucial for the SDK.

**2. Obtain Sentry Credentials:**
   - **DSN:** Found in your Sentry project settings under `Client Keys (DSN)`.
   - **Organization Slug:** Visible in your browser's URL when you're in your Sentry organization (e.g., `https://<organization_slug>.sentry.io/`). Also found in `Settings -> General Settings -> Slug`.
   - **Project Slug:** The name you gave your project in Sentry. Visible in your Sentry project URL or settings.
   - **Auth Token:** For uploading source maps. 
     - Go to `User Settings (click your name/avatar) -> API Keys`.
     - Click `Create New Token`.
     - Give it `project:releases` (or `project:write`) and `org:read` scopes.
     - Copy this token securely.

**3. Configure Environment Variables for Vercel (Client-Side DSN):**
   - In your Vercel project settings, go to `Settings -> Environment Variables`.
   - Add the following variable for **Production** and **Preview** environments:
     - `VITE_SENTRY_DSN`: Paste the DSN you obtained from Sentry.
   - The React application (`src/main.tsx`) uses this DSN to send errors and performance data to Sentry.

**4. Configure GitHub Secrets (for Source Map Uploads during CI Build):**
   - In your GitHub repository, go to `Settings -> Secrets and variables -> Actions`.
   - Add the following secrets. These are used by the Sentry Vite plugin during the `npm run build` step in the CI workflow to upload source maps:
     - `SENTRY_ORG`: Your Sentry organization slug.
     - `SENTRY_PROJECT`: Your Sentry project slug.
     - `SENTRY_AUTH_TOKEN`: The Sentry auth token you created.

**How it Works:**
- **Client-Side (Error/Performance Reporting):** `src/main.tsx` initializes Sentry using `VITE_SENTRY_DSN` (from Vercel env vars). It captures runtime errors and performance data.
- **Build-Time (Source Map Upload):** `vite.config.ts` uses the `sentryVitePlugin`. During the `npm run build` in the GitHub Actions workflow, this plugin (if `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` are set as GitHub Secrets and passed to the build step) uploads your source maps to Sentry. This allows Sentry to show you unminified code in stack traces.

**Note on Vercel Sentry Integration:** Vercel also offers a direct Sentry integration (Marketplace). If you use that, it might automatically handle source map uploads from Vercel builds, potentially simplifying the Vite plugin setup or CI environment variables. The current setup assumes source maps are uploaded by the Vite plugin during the CI build.

## Troubleshooting

### Common Issues

1. **Vercel deployment fails with authentication error**
   - Verify VERCEL_TOKEN is valid and has correct permissions
   - Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct

2. **Lighthouse CI fails**
   - Check that performance requirements are met (≥90 score)
   - Verify build artifacts are available
   - Check Lighthouse CI configuration in `lighthouserc.js`

3. **Build artifacts missing**
   - Ensure the build step completes successfully
   - Check that `dist/` directory is created and contains files
   - Verify artifact upload/download steps in workflow

### Getting Help

- Check GitHub Actions logs for detailed error messages
- Verify all required secrets are set
- Test Vercel CLI commands locally first
- Review Vercel deployment logs in the Vercel dashboard 