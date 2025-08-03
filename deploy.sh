#!/bin/bash

# Deployment Script for Enrollment System
echo "🚀 Starting deployment process..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the frontend
echo "🔨 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Test backend
echo "🧪 Testing backend..."
cd backend
npm start &
BACKEND_PID=$!
sleep 5

# Test if backend is running
curl -s http://localhost:5000/api/test > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running!"
    kill $BACKEND_PID
else
    echo "❌ Backend test failed!"
    kill $BACKEND_PID
    exit 1
fi
cd ..

echo ""
echo "🎉 Your project is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy backend to Railway:"
echo "   - Go to railway.app"
echo "   - Create new project"
echo "   - Connect your GitHub repo"
echo "   - Select 'backend' folder"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "3. Deploy frontend to Vercel:"
echo "   - Go to vercel.com"
echo "   - Import your GitHub repo"
echo "   - Configure build settings"
echo "   - Add VITE_API_URL environment variable"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 