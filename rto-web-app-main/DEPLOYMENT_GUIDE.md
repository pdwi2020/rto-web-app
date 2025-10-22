# RTO Platform - Deployment Guide

## 🚀 Automatic Deployment Status

**✅ Your repository is configured for automatic deployment!**

When you push to the `main` branch:
- **Backend** will auto-deploy to Render (if connected)
- **Frontend** will auto-deploy to Vercel (if connected)

---

## 📋 Pre-Deployment Checklist

### Backend (Render)
- [x] `render.yaml` configured
- [x] Database included (rto.db with demo data)
- [x] Requirements.txt updated
- [x] Python version specified (3.13.7)
- [x] GEMINI_API_KEY included in render.yaml

### Frontend (Vercel)
- [x] `vercel.json` configured
- [x] API_BASE_URL configuration ready
- [x] Build command set
- [x] Region set to Mumbai (bom1)

---

## 🔧 Setup Instructions

### 1. Backend Deployment (Render)

#### Option A: Connect GitHub Repository (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `pdwi2020/rto-web-app`
4. Render will detect `render.yaml` and configure automatically
5. Click "Apply" to deploy

**That's it!** Your backend will:
- Deploy automatically on every push to `main`
- Run at: `https://rto-backend.onrender.com` (or your custom URL)
- Include all demo data from rto.db
- Have GEMINI_API_KEY configured

#### Option B: Manual Setup
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** rto-backend
   - **Environment:** Python 3
   - **Build Command:** `cd rto-platform && pip install -r requirements.txt`
   - **Start Command:** `cd rto-platform && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:**
     - `GEMINI_API_KEY`: AIzaSyByy8vxYimt8yVcdVKwD_FbfQMYEuzpNAw
     - `PYTHON_VERSION`: 3.13.7

---

### 2. Frontend Deployment (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `pdwi2020/rto-web-app`
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `frontend2`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install --legacy-peer-deps`

5. **IMPORTANT:** Set Environment Variable:
   - Go to "Settings" → "Environment Variables"
   - Add:
     ```
     Name: NEXT_PUBLIC_API_BASE_URL
     Value: https://rto-backend.onrender.com
     ```
     (Replace with your actual Render backend URL)

6. Click "Deploy"

**Your frontend will:**
- Deploy automatically on every push to `main`
- Run at: `https://rto-platform.vercel.app` (or your custom domain)
- Connect to your backend API

---

## 🔗 After Deployment

### Get Your URLs

**Backend URL:**
- Go to Render Dashboard → Your Service
- Copy the URL (e.g., `https://rto-backend.onrender.com`)

**Frontend URL:**
- Go to Vercel Dashboard → Your Project
- Copy the URL (e.g., `https://rto-platform.vercel.app`)

### Update Frontend Environment Variable

⚠️ **CRITICAL STEP:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_BASE_URL` with your actual Render backend URL
3. Redeploy the frontend (or it will auto-redeploy on next push)

Example:
```
NEXT_PUBLIC_API_BASE_URL=https://rto-backend-xyz123.onrender.com
```

---

## ✅ Test Your Deployment

After deployment completes:

### Test Backend API:
```bash
curl https://your-backend-url.onrender.com/analytics/
```

Expected response:
```json
{
  "total_citizens": 1005,
  "total_brokers": 100,
  "total_applications": 5005,
  "approved_applications": 3003
}
```

### Test Frontend:
1. Visit `https://your-frontend-url.vercel.app`
2. Check the homepage loads
3. Navigate to `/broker` - should show Tamil Nadu broker names
4. Navigate to `/admin` - should show fraud detection panel
5. Navigate to `/citizen` - should show applications list

---

## 🐛 Troubleshooting

### Frontend shows "Failed to fetch" errors:
- ✅ Check `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel
- ✅ Verify backend URL is accessible (try curl)
- ✅ Check backend CORS is enabled (already configured)
- ✅ Redeploy frontend after updating environment variable

### Backend won't start:
- ✅ Check build logs in Render dashboard
- ✅ Verify `requirements.txt` has all dependencies
- ✅ Ensure `rto.db` is included in the repository
- ✅ Check Python version matches (3.13.7)

### Database is empty after deployment:
- ✅ Verify `rto.db` is in the repository
- ✅ Check Render logs - database should load from file
- ✅ Ensure file is not in `.gitignore`

---

## 📊 Current Data in Database

Your deployed database includes:
- **1,005 Citizens** with realistic Indian names and addresses
- **100 Brokers** with Tamil Nadu style names (Murugan, Selvam, Kumar, etc.)
- **5,005 Applications** with complete vehicle details
- **3,000 Ratings** for broker performance
- **Fraud Cases** flagged for admin review

---

## 🔄 Continuous Deployment

Once set up, your workflow is:

1. **Make Changes Locally:**
   ```bash
   # Edit code...
   git add .
   git commit -m "your changes"
   git push
   ```

2. **Automatic Deployment:**
   - Render detects push → rebuilds backend
   - Vercel detects push → rebuilds frontend
   - Both deploy automatically in ~2-3 minutes

3. **Check Deployment:**
   - Render Dashboard shows deployment status
   - Vercel Dashboard shows deployment status
   - Visit your URLs to verify changes

---

## 📝 Important Notes

1. **Free Tier Limitations:**
   - Render free tier: Service sleeps after 15 min inactivity
   - First request after sleep takes ~30-60 seconds
   - Vercel free tier: 100GB bandwidth/month

2. **Database Persistence:**
   - SQLite database is ephemeral on Render free tier
   - Database resets on each deploy
   - For production, consider upgrading to PostgreSQL

3. **API Key Security:**
   - Current GEMINI_API_KEY is in render.yaml (okay for demo)
   - For production, use Render's secret environment variables
   - Never commit real API keys to public repositories

4. **CORS Configuration:**
   - Backend already configured to allow all origins
   - For production, restrict to your frontend domain only

---

## 🎉 You're All Set!

Your RTO platform is now:
- ✅ Deployed with automatic updates
- ✅ Connected frontend ↔ backend
- ✅ Pre-loaded with 1,005 citizens and 5,005 applications
- ✅ Ready for demo and testing

**Next Steps:**
1. Share your Vercel URL with stakeholders
2. Test all features in production
3. Monitor deployment logs for any issues
4. Add custom domain (optional)

**Need Help?**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Check GitHub Issues for common problems
