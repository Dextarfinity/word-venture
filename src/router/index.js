import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '../views/TabsPage.vue';
import { AuthService } from '@/services';

const routes = [
  {
    path: '/',
    redirect: '/splash',
    meta: { requiresGuest: true }
  },
  {
    path: '/splash',
    component: () => import('@/views/SplashPage.vue'),
    meta: { requiresGuest: true }
  },
  // Auth routes (guest only)
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    component: () => import('@/views/SignUpPage.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/forgot-password',
    component: () => import('@/views/ForgotPasswordPage.vue'),
    meta: { requiresGuest: true }
  },
  // Student routes (student and admin access)
  {
    path: '/student',
    redirect: '/student/home',
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/home',
    component: () => import('@/views/StudentHomePage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/classes',
    component: () => import('@/views/ClassesPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/class-detail/:id',
    component: () => import('@/views/ClassDetailPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/notifications',
    component: () => import('@/views/NotificationsPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/profile',
    component: () => import('@/views/ProfilePage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/settings',
    component: () => import('@/views/SettingsPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/stories',
    component: () => import('@/views/StoriesPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/student/achievements',
    component: () => import('@/views/AchievementsPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  {
    path: '/story-miscue-review',
    component: () => import('@/views/StoryMiscueReviewPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['student', 'admin'] }
  },
  // Teacher routes (teacher and admin access)
  {
    path: '/teacher',
    redirect: '/teacher/home',
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/home',
    component: () => import('@/views/TeacherHomePage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/classes',
    component: () => import('@/views/ClassesPageTeacher.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/classroom/:id',
    component: () => import('@/views/ClassroomTeacher.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/classroom-settings/:id',
    component: () => import('@/views/ClassroomSettings.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/notifications',
    component: () => import('@/views/NotificationsPageTeacher.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/profile',
    component: () => import('@/views/ProfilePageTeacher.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  {
    path: '/teacher/settings',
    component: () => import('@/views/SettingsPageTeacher.vue'),
    meta: { requiresAuth: true, allowedRoles: ['teacher', 'admin'] }
  },
  // Admin routes (admin only)
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  {
    path: '/admin/dashboard',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  {
    path: '/admin/profile',
    component: () => import('@/views/AdminProfilePage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  {
    path: '/admin/users',
    component: () => import('@/views/UserManagementPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  {
    path: '/admin/auth-diagnostics',
    component: () => import('@/views/AuthDiagnosticsPage.vue'),
    meta: { requiresAuth: true, allowedRoles: ['admin'] }
  },
  // Offline Reading routes (Public access - no auth required)
  {
    path: '/offline-reading-selection',
    component: () => import('@/views/OfflineReadingSelection.vue'),
    meta: { public: true }
  },
  {
    path: '/offline-reading-stories',
    component: () => import('@/views/OfflineReadingStories.vue'),
    meta: { public: true }
  },
  {
    path: '/offline-reading-words',
    component: () => import('@/views/OfflineReadingWords.vue'),
    meta: { public: true }
  },
  // Main app tabs (for general/shared components - requires auth)
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true, allowedRoles: ['student', 'teacher', 'admin'] },
    children: [
      {
        path: '',
        redirect: '/tabs/tab4',
      },
      {
        path: 'tab4',
        component: () => import('@/views/WordReadingPage.vue'),
        meta: { requiresAuth: true, allowedRoles: ['student', 'teacher', 'admin'] }
      },
      {
        path: 'tab6',
        component: () => import('@/views/Tabs6Page.vue'),
        meta: { requiresAuth: true, allowedRoles: ['student', 'teacher', 'admin'] }
      },      
      {
        path: 'tab7',
        component: () => import('@/views/Tabs7Page.vue'),
        meta: { requiresAuth: true, allowedRoles: ['student', 'teacher', 'admin'] }
      },
    ],
  },
  // Catch-all route for invalid URLs (must be last)
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: () => {
      // This will be properly handled by the route guard
      // which will check authentication and redirect appropriately
      return '/splash'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Route guard function
router.beforeEach(async (to, from, next) => {
  try {
    console.log(`🛡️ Route Guard: Navigating to ${to.path}`)
    
    // Check authentication status
    const session = await AuthService.getCurrentSession()
    const isAuthenticated = session.success && session.data?.user
    let userProfile = null
    let userRole = null

    if (isAuthenticated) {
      const profileResult = await AuthService.getUserProfile(session.data.user.id)
      if (profileResult.success) {
        userProfile = profileResult.data
        userRole = userProfile.user_type
      }
    }

    // Helper function to get default home route for user role
    const getHomeRoute = (role) => {
      switch (role) {
        case 'admin':
          return '/admin/dashboard'
        case 'teacher':
          return '/teacher/home'
        case 'student':
          return '/student/home'
        default:
          return '/splash'
      }
    }

    // Check if route is public (offline reading pages)
    if (to.meta?.public) {
      console.log('📖 Public route access allowed')
      return next()
    }

    // Handle guest-only routes (splash, login, signup, forgot-password)
    if (to.meta?.requiresGuest) {
      if (isAuthenticated) {
        console.log('🔒 Authenticated user trying to access guest route - redirecting to home')
        return next(getHomeRoute(userRole))
      } else {
        console.log('👤 Guest access to auth pages allowed')
        return next()
      }
    }

    // Handle authenticated routes
    if (to.meta?.requiresAuth) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        console.log('🚫 Unauthenticated user trying to access protected route - redirecting to splash')
        return next('/splash')
      }

      // Check role permissions
      const allowedRoles = to.meta.allowedRoles || []
      
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // Redirect to role-appropriate home route
        switch (userRole) {
          case 'student':
            console.log(`🚫 Student not allowed access to ${to.path} - redirecting to /student/home`)
            return next('/student/home')
          case 'teacher':
            console.log(`🚫 Teacher not allowed access to ${to.path} - redirecting to /teacher/home`)
            return next('/teacher/home')
          case 'admin':
            console.log(`🚫 Admin not allowed access to ${to.path} - redirecting to /admin/dashboard`)
            return next('/admin/dashboard')
          default:
            console.log(`🚫 Unknown role '${userRole}' trying to access ${to.path} - redirecting to /splash`)
            return next('/splash')
        }
      }

      // Special handling for admins accessing non-admin routes
      if (userRole === 'admin' && !to.path.startsWith('/admin')) {
        // Allow admin to access other role routes but log it
        console.log(`🔑 Admin accessing non-admin route: ${to.path}`)
      }

      console.log(`✅ Access granted to ${to.path} for role: ${userRole}`)
      return next()
    }

    // Default: allow navigation
    console.log('➡️ Default route access allowed')
    next()

  } catch (error) {
    console.error('❌ Route guard error:', error)
    // On error, redirect users based on authentication status
    try {
      const session = await AuthService.getCurrentSession()
      if (session.success && session.data?.user) {
        const profileResult = await AuthService.getUserProfile(session.data.user.id)
        if (profileResult.success) {
          const userRole = profileResult.data.user_type
          // Redirect to role-appropriate home
          switch (userRole) {
            case 'student':
              return next('/student/home')
            case 'teacher':
              return next('/teacher/home')
            case 'admin':
              return next('/admin/dashboard')
            default:
              return next('/splash')
          }
        } else {
          // If profile fetch fails, redirect to splash for re-authentication
          return next('/splash')
        }
      } else {
        // Unauthenticated user - redirect to splash
        return next('/splash')
      }
    } catch (fallbackError) {
      console.error('❌ Fallback route guard error:', fallbackError)
      // Ultimate fallback - always redirect to splash
      next('/splash')
    }
  }
})

export default router;
