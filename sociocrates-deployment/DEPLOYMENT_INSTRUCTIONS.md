# Sociocrates Deployment Instructions

## Quick Start for GoDaddy Hosting

### 1. Upload Files
Upload the entire contents of this folder to your GoDaddy hosting account:
- **For WordPress Integration**: Upload to `/public_html/app/` folder
- **For Standalone**: Upload to `/public_html/` folder

### 2. Set Environment Variables in GoDaddy
```env
DATABASE_URL=postgresql://neondb_owner:npg_X47CwdgqZFYK@ep-weathered-bird-aafglqfx-pooler.westus3.azure.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0
NODE_ENV=production
PORT=3000
```

### 3. Install Dependencies
In GoDaddy terminal/SSH:
```bash
cd /path/to/uploaded/files
npm install --production
```

### 4. Start the App
```bash
npm start
```

### 5. Access Your App
- **WordPress Integration**: https://sociocrates.com/app/
- **Standalone**: https://sociocrates.com/

### 6. Create First Admin User
1. Register on the website
2. In your Neon database, run:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## File Structure Included:
```
sociocrates-deployment/
├── dist/                           # Built React frontend
├── server/                         # Node.js backend
├── shared/                         # Database schema
├── package.json                    # Production dependencies
├── drizzle.config.ts              # Database configuration
├── .env.production.example        # Environment template
├── WORDPRESS_INTEGRATION.md       # WordPress setup guide
└── DEPLOYMENT_INSTRUCTIONS.md     # This file
```

## Troubleshooting
- Ensure Node.js 18+ is available on your hosting
- Check that environment variables are set correctly
- Verify database connection string is accurate
- Review GoDaddy error logs if app won't start

## Support
Your Neon database is already configured and ready!
The app will automatically create all necessary tables on first connection.
