# Deployment Guide - RTO Platform

## 🚀 Free Deployment: Vercel + Render

**Total Cost: ₹0** (No credit card required)

---

## Prerequisites

1. GitHub account (free)
2. Vercel account (free) - https://vercel.com
3. Render account (free) - https://render.com

---

## Step 1: Push Code to GitHub

```bash
cd /Users/paritoshdwivedi/rto-project

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: RTO Platform with AI features"

# Create repository on GitHub and push
# (Follow GitHub instructions to create new repo)
git remote add origin https://github.com/YOUR_USERNAME/rto-platform.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

### Option A: Via Dashboard (Easiest)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the `rto-platform` folder
5. Configure:
   - **Name**: `rto-backend`
   - **Region**: Oregon (closest to Mumbai: Singapore if available)
   - **Branch**: `main`
   - **Root Directory**: `rto-platform`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
6. Click **"Advanced"** and add Environment Variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyByy8vxYimt8yVcdVKwD_FbfQMYEuzpNAw`
7. Click **"Create Web Service"**

### Option B: Using render.yaml (Automatic)

The `render.yaml` file is already created. Render will auto-detect it!

**Your backend will be live at**: `https://rto-backend-XXXX.onrender.com`

**Note**: First request after 15 min may take 30 seconds (cold start).

---

## Step 3: Deploy Frontend to Vercel

### Option A: Via Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel auto-detects Next.js!
5. Configure:
   - **Root Directory**: `frontend2`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `.next` (auto-filled)
6. Add Environment Variable:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://rto-backend-XXXX.onrender.com` (use your Render URL)
7. Click **"Deploy"**

### Option B: Using Vercel CLI

```bash
cd /Users/paritoshdwivedi/rto-project/frontend2

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variable when prompted:
# NEXT_PUBLIC_API_BASE_URL=https://rto-backend-XXXX.onrender.com
```

**Your frontend will be live at**: `https://rto-platform-XXXX.vercel.app`

---

## Step 4: Update Frontend Environment

After backend is deployed, update frontend environment:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_API_BASE_URL`
3. Set to your Render backend URL: `https://rto-backend-XXXX.onrender.com`
4. Redeploy frontend

---

## Step 5: Test Production Deployment

1. Visit your Vercel URL: `https://rto-platform-XXXX.vercel.app`
2. Test pages:
   - `/` - Landing page
   - `/brokers` - Browse brokers
   - `/apply` - Submit application
   - `/admin` - Admin dashboard
   - `/chat` - AI chatbot
3. First backend request may take 30 seconds (cold start)

---

## 🎉 You're Live!

- **Frontend**: `https://rto-platform-XXXX.vercel.app`
- **Backend**: `https://rto-backend-XXXX.onrender.com`
- **API Docs**: `https://rto-backend-XXXX.onrender.com/docs`

---

## Database Note

**Current**: SQLite (local file)
**Production**: Consider upgrading to Render's free PostgreSQL

To add PostgreSQL:
1. In Render dashboard, create PostgreSQL database (free 256MB)
2. Update `models.py` connection string
3. Run migrations

---

## Auto-Deployment

Both platforms support auto-deployment:
- Push to GitHub → Automatic deployment
- No manual steps needed after setup!

---

## Monitoring

- **Vercel**: Analytics at vercel.com/dashboard
- **Render**: Logs at render.com/dashboard

---

## Custom Domain (Optional)

Both platforms support custom domains:
- Vercel: Free SSL, easy setup
- Render: Free SSL, easy setup

---

## Troubleshooting

### Backend cold start taking long?
- Normal on free tier (15 min inactivity = sleep)
- Upgrade to paid tier for 24/7 uptime ($7/month)

### CORS errors?
- Check `NEXT_PUBLIC_API_BASE_URL` is set correctly
- Ensure backend CORS allows frontend domain

### Environment variables not working?
- Redeploy after adding variables
- Check variable names match code

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs

**Total Setup Time**: 15-20 minutes
**Total Cost**: ₹0 Forever! 🎉
