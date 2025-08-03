# Deployment Guide for Enrollment System

This guide will help you deploy your Vue.js + Node.js enrollment system to production.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway account (free tier available)
- MySQL database (PlanetScale, Railway, or any cloud MySQL provider)

## Step 1: Database Setup

### Option A: PlanetScale (Recommended - Free Tier)
1. Go to [planetscale.com](https://planetscale.com)
2. Create a free account
3. Create a new database
4. Get your connection details (host, user, password, database name)

### Option B: Railway MySQL
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add MySQL service
4. Get connection details from the service

## Step 2: Backend Deployment (Railway)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Create new project
   - Connect your GitHub repository
   - Select the `backend` folder as the source
   - Add environment variables:
     ```
     DB_HOST=your-mysql-host
     DB_USER=your-mysql-user
     DB_PASSWORD=your-mysql-password
     DB_NAME=your-mysql-database
     DB_PORT=3306
     PORT=5000
     ```
   - Deploy the project
   - Copy the generated URL (e.g., `https://your-app.railway.app`)

## Step 3: Frontend Deployment (Vercel)

1. **Update API URL**
   - Edit `env.production` file
   - Replace `https://your-backend-url.com` with your Railway backend URL

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-railway-backend-url.railway.app
     ```
   - Deploy

## Step 4: Database Migration

1. **Export your local database**
   ```bash
   mysqldump -u root -p ncst_enrollment1 > database_backup.sql
   ```

2. **Import to production database**
   - Use your database provider's import tool
   - Or connect via MySQL client and run:
     ```sql
     source database_backup.sql;
     ```

## Step 5: Test Your Deployment

1. Visit your Vercel frontend URL
2. Test login functionality
3. Test admin and student features
4. Check if all API calls work correctly

## Alternative Deployment Options

### Option 1: All-in-One (Render)
- Deploy both frontend and backend to Render
- Use Render's MySQL service

### Option 2: AWS
- Frontend: S3 + CloudFront
- Backend: EC2 or Lambda
- Database: RDS MySQL

### Option 3: Google Cloud
- Frontend: Firebase Hosting
- Backend: Cloud Run
- Database: Cloud SQL

### Option 4: DigitalOcean
- Frontend: App Platform
- Backend: App Platform
- Database: Managed MySQL

## Environment Variables Reference

### Backend (.env)
```
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database
DB_PORT=3306
PORT=5000
```

### Frontend (.env.production)
```
VITE_API_URL=https://your-backend-url.com
```

## Troubleshooting

### Common Issues:
1. **CORS errors**: Ensure your backend allows requests from your frontend domain
2. **Database connection**: Check environment variables and database credentials
3. **Build errors**: Ensure all dependencies are in package.json
4. **API 404 errors**: Verify API endpoints and routing

### Debug Steps:
1. Check Railway logs for backend errors
2. Check Vercel build logs for frontend errors
3. Test API endpoints directly using Postman or curl
4. Verify environment variables are set correctly

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **Database**: Use strong passwords and restrict access
3. **HTTPS**: Ensure all production URLs use HTTPS
4. **CORS**: Configure CORS properly for production domains

## Cost Estimation

### Free Tier (Recommended for starting):
- Vercel: Free (frontend)
- Railway: Free (backend + database)
- Total: $0/month

### Paid Options:
- Vercel Pro: $20/month
- Railway Pro: $5/month
- PlanetScale Pro: $29/month
- Total: ~$54/month

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review platform-specific documentation
3. Check your application logs
4. Verify all environment variables are set correctly 