const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configuration
const { db, testConnection } = require('./config/database');

// Import middleware
const { authStudent, authAdmin } = require('./middleware/auth');
const sanitize = require('./middleware/sanitize');

// Import controllers
const authController = require('./controllers/authController');
const studentController = require('./controllers/studentController');
const adminStudentController = require('./controllers/adminStudentController');
const enrollmentController = require('./controllers/enrollmentController');
const sectionController = require('./controllers/sectionController');
const subjectController = require('./controllers/subjectController');
const adminCourseController = require('./controllers/adminCourseController');
const scheduleController = require('./controllers/scheduleController');
const accountabilityController = require('./controllers/accountabilityController');
const gradeController = require('./controllers/gradeController');
const roomController = require('./controllers/roomController');
const instructorController = require('./controllers/instructorController');
const publicEnrollmentController = require('./controllers/publicEnrollmentController');
const adminFreshmanEnrollmentController = require('./controllers/adminFreshmanEnrollmentController');

const app = express();

// CORS configuration
app.use(cors());

// Security middleware
app.use(helmet());

// Basic rate limiting (tune as needed)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
});
app.use('/api', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize all incoming inputs (body, query, params)
app.use(sanitize);

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// === AUTHENTICATION ROUTES ===
app.post('/api/login', authController.studentLogin);
app.post('/api/admin/login', authController.adminLogin);
app.post('/api/auth/refresh', authController.refreshToken);

// === STUDENT ROUTES ===
app.get('/api/student/sections', authStudent, studentController.getAvailableSections);
app.get('/api/student/sections/all', authStudent, studentController.getAllAvailableSections);
app.get('/api/student/enrollment', authStudent, studentController.getCurrentEnrollment);
app.get('/api/student/accountabilities', authStudent, studentController.getAccountabilities);
app.get('/api/student/grades', authStudent, studentController.getGrades);
app.get('/api/student/notifications', authStudent, studentController.getNotifications);
app.post('/api/student/notifications/:id/read', authStudent, studentController.markNotificationAsRead);

// Lightweight instructor lookup used by frontend; returns a display name
app.get('/api/instructors/:id', authStudent, instructorController.getInstructor);

// === ENROLLMENT ROUTES ===
app.post('/api/student/enroll', authStudent, enrollmentController.submitEnrollment);
app.get('/api/admin/enrollments', authAdmin, enrollmentController.getPendingEnrollments);
app.post('/api/admin/enrollments/:id/approve', authAdmin, enrollmentController.approveEnrollment);
app.post('/api/admin/enrollments/:id/reject', authAdmin, enrollmentController.rejectEnrollment);

// === FRESHMAN ENROLLMENT (ADMIN) ===
app.get('/api/admin/freshman-enrollments', authAdmin, adminFreshmanEnrollmentController.getAllFreshmanEnrollments);
app.get('/api/admin/freshman-enrollments/:id', authAdmin, adminFreshmanEnrollmentController.getFreshmanEnrollmentById);
app.post('/api/admin/freshman-enrollments/:id/process', authAdmin, adminFreshmanEnrollmentController.processFreshmanEnrollment);
app.post('/api/admin/freshman-enrollments/:id/accept', authAdmin, adminFreshmanEnrollmentController.acceptFreshmanEnrollment);
app.post('/api/admin/freshman-enrollments/:id/reject', authAdmin, adminFreshmanEnrollmentController.rejectFreshmanEnrollment);
app.post('/api/admin/freshman-enrollments/:id/documents', authAdmin, adminFreshmanEnrollmentController.updateEnrollmentDocuments);
app.post('/api/admin/freshman-enrollments', authAdmin, adminFreshmanEnrollmentController.submitAdminFreshmanEnrollment);
// Fetch freshman enrollment by student_id (for Admin modal edit sync)
app.get(
  '/api/admin/freshman-enrollments/by-student/:student_id',
  authAdmin,
  adminFreshmanEnrollmentController.getFreshmanEnrollmentByStudentId
);

// Update freshman enrollment by student_id (for Admin modal edit sync)
app.put(
  '/api/admin/freshman-enrollments/by-student/:student_id',
  authAdmin,
  adminFreshmanEnrollmentController.updateFreshmanEnrollmentByStudentId
);

// === PUBLIC/OPEN ROUTES ===
// Courses list for public/freshman enrollment form (no auth)
app.get('/api/public/courses', subjectController.getCourses);
// Backward-compatible public alias
app.get('/api/courses', subjectController.getCourses);
// Freshman enrollment submission (no auth)
app.post('/api/public/freshman-enrollment', publicEnrollmentController.submitFreshmanEnrollment);

// === IRREGULAR ENROLLMENT ROUTES ===
app.get('/api/student/subjects/all-scheduled', authStudent, enrollmentController.getAllScheduledSubjects);
// Admin equivalent for irregular UI
app.get('/api/admin/subjects/all-scheduled', authAdmin, enrollmentController.getAllScheduledSubjects);
app.post('/api/student/enroll/irregular', authStudent, enrollmentController.submitIrregularEnrollment);
app.get('/api/admin/enrollments/:id/irregular-details', authAdmin, enrollmentController.getIrregularEnrollmentDetails);

// === ADMIN: Create enrollments on behalf of a student ===
app.post('/api/admin/students/:studentId/enroll', authAdmin, enrollmentController.adminCreateEnrollment);
app.post('/api/admin/students/:studentId/enroll/irregular', authAdmin, enrollmentController.adminCreateIrregularEnrollment);

// === SECTION MANAGEMENT ROUTES ===
app.get('/api/admin/sections', sectionController.getAllSections);
app.post('/api/admin/sections', sectionController.createSection);
app.put('/api/admin/sections/:id', sectionController.updateSection);
app.delete('/api/admin/sections/:id', sectionController.deleteSection);
app.get('/api/admin/sections/:id/status', sectionController.getSectionStatus);
app.post('/api/admin/sections/:id/status', sectionController.updateSectionStatus);
app.get('/api/admin/sections/:sectionId/schedules', sectionController.getSectionSchedules);
app.get('/api/admin/sections/:sectionId/enrollments', sectionController.getSectionEnrollments);

// --- COURSE MANAGEMENT ROUTES ---
app.get('/api/admin/courses', authAdmin, adminCourseController.getAllCourses);
app.post('/api/admin/courses', authAdmin, adminCourseController.createCourse);
app.put('/api/admin/courses/:id', authAdmin, adminCourseController.updateCourse);
app.delete('/api/admin/courses/:id', authAdmin, adminCourseController.deleteCourse);

// === SUBJECT MANAGEMENT ROUTES ===
app.get('/api/admin/subjects', authAdmin, subjectController.getSubjects);
app.post('/api/admin/subjects', authAdmin, subjectController.createSubject);
app.put('/api/admin/subjects/:id', authAdmin, subjectController.updateSubject);
app.delete('/api/admin/subjects/:id', authAdmin, subjectController.deleteSubject);
app.get('/api/admin/subjects/:id', authAdmin, subjectController.getSubject);

// === SCHEDULE MANAGEMENT ROUTES ===
app.post('/api/admin/sections/:sectionId/subjects', authAdmin, scheduleController.assignSubjectsToSection);
app.post('/api/admin/sections/:sectionId/subjects/validate', authAdmin, scheduleController.assignSubjectsToSection); 
app.delete('/api/admin/sections/:sectionId/subjects/:subjectId', authAdmin, scheduleController.removeSubjectFromSection);
app.post('/api/admin/sections/:sectionId/schedules', authAdmin, scheduleController.bulkAssignSchedules);
app.post('/api/admin/sections/:sectionId/assign-with-schedules', authAdmin, scheduleController.assignWithSchedules);
app.get('/api/admin/sections/:sectionId/subjects/:subjectId/schedule', authAdmin, scheduleController.getSectionSubjectSchedule);
app.get('/api/admin/subjects/:subjectId/schedule', authAdmin, scheduleController.getSubjectSchedule);
app.put('/api/admin/subjects/:subjectId/schedule', authAdmin, scheduleController.updateSubjectSchedule);
app.get('/api/admin/subjects/:subjectId/schedules', authAdmin, scheduleController.getSubjectSchedules);
app.get('/api/admin/subjects/:subjectId/schedules/full', authAdmin, scheduleController.getSubjectFullSchedules);
app.get('/api/admin/schedules', authAdmin, scheduleController.getAllSchedulesFull);

// === STUDENT MANAGEMENT ROUTES ===
app.get('/api/admin/students/next-id', authAdmin, adminStudentController.getNextStudentId);
app.get('/api/admin/students', authAdmin, adminStudentController.getAllStudents);
app.post('/api/admin/students', authAdmin, adminStudentController.createStudent);
app.put('/api/admin/students/:student_id', authAdmin, adminStudentController.updateStudent);
app.delete('/api/admin/students/:student_id', authAdmin, adminStudentController.deleteStudent);

// === ACCOUNTABILITY MANAGEMENT ROUTES ===
app.get('/api/admin/accountabilities', authAdmin, accountabilityController.getAllAccountabilities);
app.post('/api/admin/accountabilities', authAdmin, accountabilityController.createAccountability);
app.put('/api/admin/accountabilities/:id', authAdmin, accountabilityController.updateAccountability);
app.delete('/api/admin/accountabilities/:id', authAdmin, accountabilityController.deleteAccountability);
app.post('/api/admin/accountabilities/:id/clear', authAdmin, accountabilityController.clearAccountability);

// === GRADE MANAGEMENT ROUTES ===
app.get('/api/admin/grades', authAdmin, gradeController.getAllGrades);
app.post('/api/admin/grades', authAdmin, gradeController.createGrade);
app.put('/api/admin/grades/:id', authAdmin, gradeController.updateGrade);
app.delete('/api/admin/grades/:id', authAdmin, gradeController.deleteGrade);
app.get('/api/admin/grades/statistics', authAdmin, gradeController.getGradeStatistics);

// === ROOM MANAGEMENT ROUTES ===
app.get('/api/admin/rooms', authAdmin, roomController.getAllRooms);
app.post('/api/admin/rooms', authAdmin, roomController.createRoom);
app.put('/api/admin/rooms/:id', authAdmin, roomController.updateRoom);
app.delete('/api/admin/rooms/:id', authAdmin, roomController.deleteRoom);
app.get('/api/admin/rooms/:id/schedules', authAdmin, roomController.getRoomSchedules);

// === UTILITY ROUTES ===
app.get('/api/test', (req, res) => {
  console.log('Test endpoint reached');
  res.json({ message: 'Server is working!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Simple error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Test DB connection on startup (will exit on failure)
try {
  // Fire-and-forget: function exits process on failure
  testConnection();
} catch (e) {
  console.error('Database connectivity check failed at startup:', e);
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Server is ready to accept requests');
});

module.exports = { db };
