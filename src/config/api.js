// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Auth endpoints
    login: '/api/login',
    adminLogin: '/api/admin/login',
    
    // Student endpoints
    studentSections: '/api/student/sections',
    studentEnrollment: '/api/student/enrollment',
    studentAccountabilities: '/api/student/accountabilities',
    studentGrades: '/api/student/grades',
    studentNotifications: '/api/student/notifications',
    markNotificationRead: '/api/student/notifications/:id/read',
    
    // Enrollment endpoints
    submitEnrollment: '/api/student/enroll',
    pendingEnrollments: '/api/admin/enrollments',
    approveEnrollment: '/api/admin/enrollments/:id/approve',
    rejectEnrollment: '/api/admin/enrollments/:id/reject',
    
    // Section endpoints
    sections: '/api/admin/sections',
    sectionStatus: '/api/admin/sections/:id/status',
    sectionSchedules: '/api/admin/sections/:sectionId/schedules',
    
    // Course endpoints
    courses: '/api/admin/courses',
    
    // Subject endpoints
    subjects: '/api/admin/subjects',
    subject: '/api/admin/subjects/:id',
    subjectSchedule: '/api/admin/subjects/:subjectId/schedule',
    subjectSchedules: '/api/admin/subjects/:subjectId/schedules',
    
    // Schedule endpoints
    assignSubjects: '/api/admin/sections/:sectionId/subjects',
    removeSubject: '/api/admin/sections/:sectionId/subjects/:subjectId',
    bulkAssignSchedules: '/api/admin/sections/:sectionId/schedules',
    assignWithSchedules: '/api/admin/sections/:sectionId/assign-with-schedules',
    sectionSubjectSchedule: '/api/admin/sections/:sectionId/subjects/:subjectId/schedule',
    allSchedules: '/api/admin/schedules',
    
    // Student management endpoints
    nextStudentId: '/api/admin/students/next-id',
    students: '/api/admin/students',
    
    // Accountability endpoints
    accountabilities: '/api/admin/accountabilities',
    clearAccountability: '/api/admin/accountabilities/:id/clear',
    
    // Grade endpoints
    grades: '/api/admin/grades',
    gradeStatistics: '/api/admin/grades/statistics',
    
    // Room endpoints
    rooms: '/api/admin/rooms',
    roomSchedules: '/api/admin/rooms/:id/schedules',
    
    // Test endpoint
    test: '/api/test'
  }
};

export const getApiUrl = (endpoint, params = {}) => {
  let url = API_CONFIG.baseURL + endpoint;
  
  // Replace URL parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
}; 