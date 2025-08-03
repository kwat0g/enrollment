# Free Database Setup Guide

Your database has been exported to `database_backup.sql`. Now let's set up a free database in the cloud.

## 🎯 Recommended: PlanetScale (Free MySQL Database)

### Step 1: Create PlanetScale Account
1. Go to [planetscale.com](https://planetscale.com)
2. Click "Start for free"
3. Sign up with GitHub (recommended) or email
4. Complete verification

### Step 2: Create Database
1. Click "New Database"
2. Choose "Create new database"
3. Fill in:
   - **Name**: `enrollment-system`
   - **Region**: Choose closest to you
   - **Plan**: Hobby (free)
4. Click "Create database"

### Step 3: Get Connection Details
1. Click on your database
2. Go to "Connect" tab
3. Copy these details:
   ```
   Host: aws.connect.psdb.cloud (example)
   Username: your_username
   Password: your_password
   Database: enrollment-system
   Port: 3306
   ```

### Step 4: Import Your Data
1. Go to "Console" tab in PlanetScale
2. Copy the contents of `database_backup.sql`
3. Paste and execute in the console
4. Verify tables are created

### Step 5: Test Connection
Run this command with your PlanetScale details:
```bash
node test-database.cjs
```

## 🔄 Alternative Free Databases

### Option 2: Railway MySQL
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MySQL service
4. Get connection details from service
5. Import your `database_backup.sql`

### Option 3: Supabase (PostgreSQL)
1. Go to [supabase.com](https://supabase.com)
2. Create free account
3. Create new project
4. Use PostgreSQL (requires schema conversion)

### Option 4: Neon (PostgreSQL)
1. Go to [neon.tech](https://neon.tech)
2. Create free account
3. Create new project
4. Use PostgreSQL (requires schema conversion)

## 🔧 Environment Variables for Railway Backend

Once you have your database details, add these to Railway:

```
DB_HOST=your-planetscale-host
DB_USER=your-planetscale-username
DB_PASSWORD=your-planetscale-password
DB_NAME=your-planetscale-database
DB_PORT=3306
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

## 📊 Database Comparison

| Provider | Type | Free Tier | Pros | Cons |
|----------|------|-----------|------|------|
| **PlanetScale** | MySQL | 1 DB, 1B reads | MySQL compatible, great UI | 7-day retention |
| Railway | MySQL | $5 credit | Easy setup | Limited free |
| Supabase | PostgreSQL | 500MB | Real-time, great features | Different DB type |
| Neon | PostgreSQL | 3GB | Serverless, fast | Different DB type |

## 🚀 Quick Start Commands

```bash
# Test your database connection
node test-database.cjs

# Export database (already done)
node export-database.cjs

# Deploy backend to Railway
# (Follow Railway deployment guide)

# Deploy frontend to Vercel
# (Follow Vercel deployment guide)
```

## 🔍 Troubleshooting

### Connection Issues
- Check if database credentials are correct
- Verify SSL settings for PlanetScale
- Ensure database exists and is accessible

### Import Issues
- Check SQL syntax in console
- Verify table names don't conflict
- Ensure proper permissions

### SSL Issues
- PlanetScale requires SSL
- Use `rejectUnauthorized: false` for testing
- Configure proper SSL certificates for production

## 💰 Cost Breakdown
- **PlanetScale**: $0/month (free tier)
- **Railway**: $0/month (free tier)
- **Vercel**: $0/month (free tier)
- **Total**: $0/month

Your database export is ready at `database_backup.sql`! 