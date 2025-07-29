import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
  },
  {
    path: '/student',
    component: () => import('@/views/StudentDashboard.vue'),
    children: [
      {
        path: 'enrollment',
        name: 'StudentEnrollment',
        component: () => import('@/views/student/Enrollment.vue'),
      },
      {
        path: 'accountabilities',
        name: 'StudentAccountabilities',
        component: () => import('@/views/student/Accountabilities.vue'),
      },
      {
        path: 'grades',
        name: 'StudentGrades',
        component: () => import('@/views/student/Grades.vue'),
      },
    ],
  },
  {
    path: '/admin',
    component: () => import('@/views/AdminDashboard.vue'),
    redirect: '/admin/students',
    children: [
      {
        path: 'sections',
        name: 'AdminSections',
        component: () => import('@/views/admin/SectionManagement.vue'),
      },
      {
        path: 'enrollments',
        name: 'AdminEnrollments',
        component: () => import('@/views/admin/EnrollmentApprovals.vue'),
      },
      {
        path: 'accountabilities',
        name: 'AdminAccountabilities',
        component: () => import('@/views/admin/Accountabilities.vue'),
      },
      {
        path: 'subjects',
        name: 'AdminSubjects',
        component: () => import('@/views/admin/SubjectManagement.vue'),
      },
      {
        path: 'courses',
        name: 'AdminCourses',
        component: () => import('@/views/admin/CourseManagement.vue'),
      },
      {
        path: 'rooms',
        name: 'AdminRooms',
        component: () => import('@/views/admin/RoomManagement.vue'),
      },
      {
        path: 'students',
        name: 'AdminStudents',
        component: () => import('@/views/admin/StudentManagement.vue'),
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('@/views/admin/Reports.vue'),
      }
    ],
  },
  {
    path: '/@dminlogin-',
    name: 'AdminLogin',
    component: () => import('@/views/AdminLogin.vue'),
    meta: { hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
