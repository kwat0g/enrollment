const express = require('express');
const cors = require('cors');

// Import configuration
const { db } = require('./config/database');

// Import middleware
const { authStudent, authAdmin } = require('./middleware/auth');

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

const app = express();
app.use(cors());
app.use(express.json());

// Add basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// === AUTHENTICATION ROUTES ===
app.post('/api/login', authController.studentLogin);
app.post('/api/admin/login', authController.adminLogin);

// === STUDENT ROUTES ===
app.get('/api/student/sections', authStudent, studentController.getAvailableSections);
app.get('/api/student/enrollment', authStudent, studentController.getCurrentEnrollment);
app.get('/api/student/accountabilities', authStudent, studentController.getAccountabilities);
app.get('/api/student/grades', authStudent, studentController.getGrades);
app.get('/api/student/notifications', authStudent, studentController.getNotifications);
app.post('/api/student/notifications/:id/read', authStudent, studentController.markNotificationAsRead);

// === ENROLLMENT ROUTES ===
app.post('/api/student/enroll', authStudent, enrollmentController.submitEnrollment);
app.get('/api/admin/enrollments', enrollmentController.getPendingEnrollments);
app.post('/api/admin/enrollments/:id/approve', enrollmentController.approveEnrollment);
app.post('/api/admin/enrollments/:id/reject', enrollmentController.rejectEnrollment);

// === SECTION MANAGEMENT ROUTES ===
app.get('/api/admin/sections', sectionController.getAllSections);
app.post('/api/admin/sections', sectionController.createSection);
app.put('/api/admin/sections/:id', sectionController.updateSection);
app.delete('/api/admin/sections/:id', sectionController.deleteSection);
app.get('/api/admin/sections/:id/status', sectionController.getSectionStatus);
app.post('/api/admin/sections/:id/status', sectionController.updateSectionStatus);
app.get('/api/admin/sections/:sectionId/schedules', sectionController.getSectionSchedules);

// --- COURSE MANAGEMENT ROUTES ---
app.get('/api/admin/courses', authAdmin, adminCourseController.getAllCourses);
app.post('/api/admin/courses', authAdmin, adminCourseController.createCourse);
app.put('/api/admin/courses/:id', authAdmin, adminCourseController.updateCourse);
app.delete('/api/admin/courses/:id', authAdmin, adminCourseController.deleteCourse);

// === SUBJECT MANAGEMENT ROUTES ===
app.get('/api/admin/subjects', subjectController.getSubjects);
app.post('/api/admin/subjects', subjectController.createSubject);
app.put('/api/admin/subjects/:id', subjectController.updateSubject);
app.delete('/api/admin/subjects/:id', subjectController.deleteSubject);
app.get('/api/admin/subjects/:id', subjectController.getSubject);

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
app.get('/api/admin/students/next-id', adminStudentController.getNextStudentId);
app.get('/api/admin/students', adminStudentController.getAllStudents);
app.post('/api/admin/students', adminStudentController.createStudent);
app.put('/api/admin/students/:student_id', adminStudentController.updateStudent);
app.delete('/api/admin/students/:student_id', adminStudentController.deleteStudent);

// === ACCOUNTABILITY MANAGEMENT ROUTES ===
app.get('/api/admin/accountabilities', accountabilityController.getAllAccountabilities);
app.post('/api/admin/accountabilities', accountabilityController.createAccountability);
app.put('/api/admin/accountabilities/:id', accountabilityController.updateAccountability);
app.delete('/api/admin/accountabilities/:id', accountabilityController.deleteAccountability);
app.post('/api/admin/accountabilities/:id/clear', authAdmin, accountabilityController.clearAccountability);

// === GRADE MANAGEMENT ROUTES ===
app.get('/api/admin/grades', gradeController.getAllGrades);
app.post('/api/admin/grades', gradeController.createGrade);
app.put('/api/admin/grades/:id', gradeController.updateGrade);
app.delete('/api/admin/grades/:id', gradeController.deleteGrade);
app.get('/api/admin/grades/statistics', gradeController.getGradeStatistics);

// === ROOM MANAGEMENT ROUTES ===
app.get('/api/admin/rooms', roomController.getAllRooms);
app.post('/api/admin/rooms', authAdmin, roomController.createRoom);
app.put('/api/admin/rooms/:id', authAdmin, roomController.updateRoom);
app.delete('/api/admin/rooms/:id', authAdmin, roomController.deleteRoom);
app.get('/api/admin/rooms/:id/schedules', roomController.getRoomSchedules);

// === UTILITY ROUTES ===
app.get('/api/test', (req, res) => {
  console.log('Test endpoint reached');
  res.json({ message: 'Server is working!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log('Server is ready to accept requests');
});

module.exports = { db };
