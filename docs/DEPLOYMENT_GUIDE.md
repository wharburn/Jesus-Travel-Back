# Deployment Guide - JT Chauffeur Services

Complete step-by-step guide to deploy the JT Chauffeur Services application.

---

## Step 1: Create GitHub Repository

### 1.1 Go to GitHub

1. Open your browser and navigate to https://github.com
2. Log in to your account (or create one if needed)

### 1.2 Create New Repository

1. Click the **"+"** icon in the top right corner
2. Select **"New repository"**
3. Fill in the details:
   - **Repository name**: `jt-chauffeur-services`
   - **Description**: `Professional chauffeur and security services with AI-powered backend`
   - **Visibility**: Choose **Private** (recommended) or Public
   - **DO NOT** initialize with README (we already have one)
4. Click **"Create repository"**

### 1.3 Copy the Repository URL

After creating, you'll see a page with setup commands. Copy the **HTTPS URL**:

```
https://github.com/YOUR_USERNAME/jt-chauffeur-services.git
```

---

## Step 2: Push Code to GitHub

### 2.1 Open Terminal

In your terminal or VS Code terminal, run these commands:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/jt-chauffeur-services.git

# Push code to GitHub
git branch -M main
git push -u origin main
```

### 2.2 Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files uploaded

---

## Step 3: Deploy Backend to Render

### 3.1 Create Render Account

1. Navigate to https://render.com
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your **GitHub account** (easiest option)
4. Authorize Render to access your GitHub repositories

### 3.2 Create PostgreSQL Database

1. In Render dashboard, click **"New +"**
2. Select **"PostgreSQL"**
3. Fill in the details:
   - **Name**: `jt-chauffeur-db`
   - **Database**: `jt_chauffeur`
   - **User**: `jt_admin` (or leave default)
   - **Region**: Choose closest to your location
   - **Plan**: **Free** (for testing)
4. Click **"Create Database"**
5. **IMPORTANT**: Copy the **Internal Database URL** (starts with `postgresql://`)
   - Save this - you'll need it in the next step!

### 3.3 Create Web Service

1. Click **"New +"** again
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - Find `jt-chauffeur-services` in the list
   - Click **"Connect"**
4. Fill in the service details:
   - **Name**: `jt-chauffeur-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: **Node**
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: **Free** (for testing)

### 3.4 Add Environment Variables

Scroll down to **"Environment Variables"** section. Click **"Add Environment Variable"** for each:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste the Internal Database URL from step 3.2>
JWT_SECRET=<generate random string using: openssl rand -base64 32>

# Upstash Redis (from your .env file)
UPSTASH_REDIS_REST_URL=<your Redis URL>
UPSTASH_REDIS_REST_TOKEN=<your Redis token>

# Upstash Vector (from your .env file)
UPSTASH_VECTOR_REST_URL=<your Vector URL>
UPSTASH_VECTOR_REST_TOKEN=<your Vector token>

# Upstash Search (from your .env file)
UPSTASH_SEARCH_REST_URL=<your Search URL>
UPSTASH_SEARCH_REST_TOKEN=<your Search token>

# OpenRouter AI (if you have it)
OPENROUTER_API_KEY=<your OpenRouter key>

# WhatsApp (if you have it)
GREEN_API_INSTANCE_ID=<your instance ID>
GREEN_API_TOKEN=<your token>
PRICING_TEAM_PHONE=<pricing team WhatsApp number>
```

### 3.5 Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://jt-chauffeur-api.onrender.com`

---

## Step 4: Test Your Backend

### 4.1 Check Health Endpoint

Open in browser:

```
https://jt-chauffeur-api.onrender.com/api/v1/health
```

You should see:

```json
{
  "status": "healthy",
  "services": {
    "redis": "connected",
    "search": "connected",
    "vector": "connected"
  }
}
```

---

## Step 5: Update Frontend

### 5.1 Update booking.js

Find the API endpoint in your `booking.js` file and update it to:

```javascript
const API_URL = 'https://jt-chauffeur-api.onrender.com/api/v1';
```

### 5.2 Test Locally

Open `booking.html` in your browser and test the booking form.

---

## Step 6: Upload Frontend to Bluehost

### 6.1 Connect to Bluehost

1. Log in to your Bluehost account
2. Go to **File Manager** or use **FTP client** (FileZilla recommended)

### 6.2 Upload Files

Upload these files to your `public_html` folder:

- All `.html` files
- All `.js` files (including updated `booking.js`)
- `images/` folder
- `favicon/` folder
- `translations.js`
- `sitemap.xml`

### 6.3 Test Live Site

Visit your website and test the booking form!

---

## You're Done!

Your setup:

- **Backend**: Running on Render
- **Database**: PostgreSQL on Render
- **Frontend**: Hosted on Bluehost
- **Services**: Upstash Redis, Vector, Search

---

## Need Help?

If you encounter issues:

1. Check Render logs (Render dashboard → Logs tab)
2. Check browser console (F12 → Console tab)
3. Verify all environment variables are set correctly
4. Ensure database connection is working

---

## Next Steps

1. Set up custom domain on Render (optional)
2. Enable HTTPS on Bluehost
3. Test all booking flows
4. Monitor Render logs for errors
5. Set up automated backups

