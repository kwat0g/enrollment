import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAdminStore } from '@/stores/admin'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('@/views/Landing.vue'),
    beforeEnter: (to, from, next) => {
      // Show landing for guests; redirect authenticated users
      const userStore = useUserStore()
      const adminStore = useAdminStore()
      userStore.loadFromStorage()
      adminStore.loadFromStorage()
      if (adminStore.isAuthenticated()) return next('/admin')
      if (userStore.isAuthenticated()) return next('/student')
      return next()
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/freshman-enrollment',
    name: 'FreshmanEnrollment',
    component: () => import('@/views/FreshmanEnrollment.vue'),
    meta: { hidden: true },
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

const HEADER_OFFSET = 68 // adjust if header height changes

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Restore saved scroll on back/forward
    if (savedPosition) return savedPosition

    // Hash/anchor navigation with header offset
    if (to.hash) {
      try {
        // Let Vue Router handle finding the element; apply offset and smooth behavior
        return { el: to.hash, top: HEADER_OFFSET, behavior: 'smooth' }
      } catch (e) {
        // Fallback: scroll to top if element not found
        return { top: 0 }
      }
    }

    // Default: scroll to top
    return { top: 0 }
  },
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const adminStore = useAdminStore()
  
  // Load from storage on each navigation
  userStore.loadFromStorage()
  adminStore.loadFromStorage()
  
  // Define protected routes
  const adminRoutes = ['/admin']
  const studentRoutes = ['/student', '/dashboard']
  const publicRoutes = ['/login', '/@dminlogin-', '/freshman-enrollment']
  
  const isAdminRoute = adminRoutes.some(route => to.path.startsWith(route))
  const isStudentRoute = studentRoutes.some(route => to.path.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => to.path.startsWith(route))
  
  // Check admin authentication
  if (isAdminRoute && !adminStore.isAuthenticated()) {
    next('/@dminlogin-')
    return
  }
  
  // Check student authentication
  if (isStudentRoute && !userStore.isAuthenticated()) {
    next('/login')
    return
  }
  
  // Redirect authenticated users away from login pages
  if (to.path === '/login' && userStore.isAuthenticated()) {
    next('/student')
    return
  }
  
  if (to.path === '/login' && adminStore.isAuthenticated()) {
    next('/admin')
    return
  }
  
  // Redirect authenticated users away from admin login page
  if (to.path === '/@dminlogin-' && adminStore.isAuthenticated()) {
    next('/admin')
    return
  }
  
  if (to.path === '/@dminlogin-' && userStore.isAuthenticated()) {
    next('/student')
    return
  }
  
  next()
})

export default router
