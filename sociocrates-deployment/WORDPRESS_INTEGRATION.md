# Sociocrates WordPress Integration Guide

## Overview
Keep your existing WordPress site at `sociocrates.com` and add the decision-making app at `sociocrates.com/app/`

## Step 1: Upload Files to GoDaddy

### Directory Structure:
```
public_html/
├── (your existing WordPress files)
├── wp-content/
├── wp-config.php
├── index.php
└── app/                    ← NEW: Sociocrates app folder
    ├── dist/              ← Built React app
    ├── server/            ← Node.js backend  
    ├── shared/            ← Database schema
    ├── package.json       ← Production dependencies
    └── node_modules/      ← Dependencies (run npm install)
```

### Upload Process:
1. **Create `/app/` folder** in your `public_html` directory
2. **Upload these files to `/app/`:**
   - `dist/` folder (complete)
   - `server/` folder (complete)  
   - `shared/` folder (complete)
   - `package.production.json` → rename to `package.json`

## Step 2: Configure Node.js App in GoDaddy

### Environment Variables:
Set these in GoDaddy hosting panel:
```env
DATABASE_URL=postgresql://neondb_owner:npg_X47CwdgqZFYK@ep-weathered-bird-aafglqfx-pooler.westus3.azure.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0
NODE_ENV=production
PORT=3000
```

### Install Dependencies:
```bash
cd /public_html/app
npm install --production
```

### Start the App:
```bash
npm start
```

## Step 3: Link from WordPress

### Add Navigation Menu Item:
1. **WordPress Admin** → Appearance → Menus
2. **Add Custom Link:**
   - URL: `https://sociocrates.com/app/`
   - Link Text: "Decision Platform" or "Collaborate"

### Add Button/Link in Posts/Pages:
```html
<a href="/app/" class="btn btn-primary">
  Access Decision Platform →
</a>
```

### Header/Footer Link:
Add to your theme's `header.php` or via Customizer:
```html
<a href="/app/">Collaborative Decisions</a>
```

## Step 4: WordPress Integration Examples

### Option A: Simple Menu Link
Add "Decision Platform" to your main navigation menu

### Option B: Call-to-Action Button  
```html
<div style="text-align: center; padding: 20px;">
  <h3>Ready to Make Decisions Together?</h3>
  <a href="/app/" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Launch Sociocratic Platform →
  </a>
</div>
```

### Option C: Widget/Sidebar
Create a custom widget with link to `/app/`

## Step 5: Testing

1. **Visit**: `https://sociocrates.com` (WordPress site)
2. **Click link to**: `https://sociocrates.com/app/` (Sociocratic app)
3. **Test registration/login** on the app
4. **Create first admin user**

## Benefits of This Setup:

✅ **Keep existing WordPress site** - No disruption  
✅ **SEO-friendly** - WordPress for content, app for functionality  
✅ **Easy navigation** - Users can flow between site and app  
✅ **Single domain** - Everything under sociocrates.com  
✅ **Independent updates** - Update WordPress and app separately  

## URL Structure:
- `sociocrates.com` → WordPress homepage
- `sociocrates.com/about` → WordPress about page  
- `sociocrates.com/blog` → WordPress blog
- `sociocrates.com/app/` → **Sociocratic Decision Platform**
- `sociocrates.com/app/dashboard` → App dashboard
- `sociocrates.com/app/proposal/123` → Specific proposal

Perfect integration of content management (WordPress) and collaborative decision-making (Sociocrates app)!
