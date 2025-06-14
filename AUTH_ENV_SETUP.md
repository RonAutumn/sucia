# Authentication Environment Setup

## Required Environment Variables

The authentication system requires an admin password to be configured via environment variables. Set up your `.env` file in the project root with the following:

### For Create React App (CRA) Projects:
```bash
REACT_APP_ADMIN_PASSWORD=your_secure_admin_password_here
```

### For Vite Projects:
```bash
VITE_ADMIN_PASSWORD=your_secure_admin_password_here
```

### For Other Environments:
```bash
ADMIN_PASSWORD=your_secure_admin_password_here
```

## Variable Priority

The system checks environment variables in this order:
1. `REACT_APP_ADMIN_PASSWORD`
2. `VITE_ADMIN_PASSWORD` 
3. `ADMIN_PASSWORD`

## Development Fallback

If no environment variable is set, the system falls back to `admin123` for development purposes. **This fallback should never be used in production.**

## Security Recommendations

### Strong Password Requirements:
- Use mixed case letters (A-Z, a-z)
- Include numbers (0-9)
- Include special symbols (@, !, #, etc.)
- Minimum 12 characters recommended
- Avoid common words or patterns

### Example Strong Password:
```bash
REACT_APP_ADMIN_PASSWORD=MyStr0ng@dm1nP@ssw0rd2024!
```

### Best Practices:
1. **Never commit your `.env` file to version control**
2. Use different passwords for different environments (dev/staging/prod)
3. Use a password manager to generate secure passwords
4. Rotate passwords regularly in production
5. Ensure your `.env` file is listed in `.gitignore`

## Authentication System Features

The implemented authentication system includes:

- ✅ **24-hour token expiration** with automatic refresh
- ✅ **3-attempt lockout** with 15-minute timeout period
- ✅ **Cross-tab session synchronization** 
- ✅ **Secure token storage** in localStorage
- ✅ **Real-time lockout monitoring** with countdown
- ✅ **Automatic session cleanup** on logout
- ✅ **Route protection** for `/admin` and `/dashboard`

## Setup Instructions

1. Create a `.env` file in your project root:
   ```bash
   touch .env
   ```

2. Add your admin password:
   ```bash
   echo "REACT_APP_ADMIN_PASSWORD=YourSecurePasswordHere" >> .env
   ```

3. Ensure `.env` is in your `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

4. Restart your development server to load the new environment variables.

## Testing the Authentication

1. Navigate to `/admin` or `/dashboard`
2. You should see the authentication modal
3. Enter your configured password
4. The system will remember your authentication for 24 hours
5. Test the lockout by entering wrong passwords 3 times

## Troubleshooting

### "Using fallback password" warning:
- Means no environment variable was found
- Check that your `.env` file exists and has the correct variable name
- Restart your development server after making changes

### Authentication not working:
- Verify the password matches exactly (case-sensitive)
- Check browser console for any error messages
- Clear localStorage if testing: `localStorage.clear()`

### Lockout issues:
- Wait 15 minutes for automatic unlock
- Or clear localStorage: `localStorage.removeItem('sucia_auth_lockout')` 