# Enrollment System

A comprehensive student enrollment management system built with Vue.js 3 and Node.js.

## Features

- **Student Portal**: Course enrollment, grade viewing, accountabilities
- **Admin Portal**: Student management, course management, enrollment approvals
- **Section Management**: Create and manage class sections
- **Schedule Management**: Assign subjects and schedules to sections
- **Room Management**: Manage classrooms and schedules
- **Grade Management**: Record and view student grades
- **Accountability Management**: Track student accountabilities

## Tech Stack

- **Frontend**: Vue.js 3, Vite, Tailwind CSS, Pinia
- **Backend**: Node.js, Express.js, MySQL
- **Authentication**: JWT tokens
- **Database**: MySQL

## Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd enrollment
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Setup database**
   - Create a MySQL database named `ncst_enrollment1`
   - Import your database schema (if you have one)

4. **Configure environment**
   - Copy `env.development` to `.env.local` for frontend
   - Update database credentials in `backend/config/database.js`

5. **Run the application**
   ```bash
   # Run both frontend and backend
   npm run a
   
   # Or run separately:
   # Frontend: npm run dev
   # Backend: npm run backend
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Deployment

### Quick Deployment (Recommended)

1. **Run the deployment script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Follow the deployment guide**
   - See `DEPLOYMENT.md` for detailed instructions
   - Deploy backend to Railway
   - Deploy frontend to Vercel

### Manual Deployment

1. **Backend (Railway)**
   - Push code to GitHub
   - Connect repository to Railway
   - Set environment variables
   - Deploy

2. **Frontend (Vercel)**
   - Import repository to Vercel
   - Configure build settings
   - Set `VITE_API_URL` environment variable
   - Deploy

3. **Database**
   - Set up MySQL database (PlanetScale, Railway, etc.)
   - Export local database and import to production

## Project Structure

```
enrollment/
├── src/                    # Frontend source code
│   ├── components/         # Vue components
│   ├── views/             # Page components
│   ├── stores/            # Pinia stores
│   ├── router/            # Vue Router configuration
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── backend/               # Backend source code
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
├── dist/                 # Built frontend files
└── node_modules/         # Dependencies
```

## API Endpoints

### Authentication
- `POST /api/login` - Student login
- `POST /api/admin/login` - Admin login

### Student Routes
- `GET /api/student/sections` - Get available sections
- `GET /api/student/enrollment` - Get current enrollment
- `POST /api/student/enroll` - Submit enrollment

### Admin Routes
- `GET /api/admin/students` - Get all students
- `POST /api/admin/students` - Create student
- `GET /api/admin/enrollments` - Get pending enrollments
- `POST /api/admin/enrollments/:id/approve` - Approve enrollment

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
```

### Backend (.env)
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ncst_enrollment1
DB_PORT=3306
PORT=5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For deployment issues, see `DEPLOYMENT.md`.
For technical support, check the troubleshooting section in the deployment guide.
