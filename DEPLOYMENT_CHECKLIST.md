# Deployment Checklist - Option 1 (Vercel + Railway)

## ✅ Pre-Deployment (COMPLETED)
- [x] Code pushed to GitHub
- [x] Environment variables configured
- [x] CORS updated for production
- [x] Build scripts ready

## 🔄 Step-by-Step Deployment

### Step 1: Database Setup (PlanetScale)
- [ ] Go to [planetscale.com](https://planetscale.com)
- [ ] Create free account
- [ ] Create new database named `enrollment-system`
- [ ] Copy connection details:
  - [ ] Host: `_________________`
  - [ ] Username: `_________________`
  - [ ] Password: `_________________`
  - [ ] Database: `_________________`
  - [ ] Port: `3306`

### Step 2: Backend Deployment (Railway)
- [ ] Go to [railway.app](https://railway.app)
- [ ] Sign up with GitHub
- [ ] Create new project
- [ ] Connect GitHub repository: `kwat0g/enrollment`
- [ ] Set Root Directory to: `backend`
- [ ] Add environment variables:
  ```
  DB_HOST=_________________
  DB_USER=_________________
  DB_PASSWORD=_________________
  DB_NAME=_________________
  DB_PORT=3306
  PORT=5000
  NODE_ENV=production
  FRONTEND_URL=https://your-app.vercel.app
  ```
- [ ] Deploy and copy backend URL: `https://_________________.railway.app`

### Step 3: Frontend Deployment (Vercel)
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Sign up with GitHub
- [ ] Import repository: `kwat0g/enrollment`
- [ ] Configure build settings:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Add environment variable:
  ```
  VITE_API_URL=https://_________________.railway.app
  ```
- [ ] Deploy and copy frontend URL: `https://_________________.vercel.app`

### Step 4: Database Migration
- [ ] Export local database:
  ```bash
  mysqldump -u root -p ncst_enrollment1 > database_backup.sql
  ```
- [ ] Go to PlanetScale Console
- [ ] Import database_backup.sql content
- [ ] Verify tables are created

### Step 5: Update CORS
- [ ] Go back to Railway backend
- [ ] Update FRONTEND_URL environment variable with your Vercel URL
- [ ] Redeploy backend

### Step 6: Testing
- [ ] Test backend: `https://_________________.railway.app/api/test`
- [ ] Test frontend: `https://_________________.vercel.app`
- [ ] Test admin login
- [ ] Test student login
- [ ] Test all features

## 🔗 Your URLs
- **Frontend**: `https://_________________.vercel.app`
- **Backend**: `https://_________________.railway.app`
- **Database**: PlanetScale

## 🚨 Troubleshooting
If you encounter issues:
1. Check Railway logs for backend errors
2. Check Vercel build logs for frontend errors
3. Verify environment variables are set correctly
4. Test API endpoints with Postman
5. Check CORS configuration

## 💰 Cost
- **Vercel**: Free tier
- **Railway**: Free tier
- **PlanetScale**: Free tier
- **Total**: $0/month 