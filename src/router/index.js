import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy-loaded route components
const Dashboard = () => import('../views/Dashboard.vue')
const Login = () => import('../views/Login.vue')
const Inventory = () => import('../views/Inventory.vue')
const InventoryCategories = () => import('../views/InventoryCategories.vue')
const Suppliers = () => import('../views/Suppliers.vue')
const NotFound = () => import('../views/NotFound.vue')

// Route definitions
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: Inventory,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin', 'warehouse', 'kitchen', 'cashier'],
      requiredCollections: ['raw_materials', 'item_categories', 'suppliers', 'units']
    }
  },
  {
    path: '/inventory-categories',
    name: 'inventory-categories',
    component: InventoryCategories,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin'] 
    }
  },
  {
    path: '/suppliers',
    name: 'suppliers',
    component: Suppliers,
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin', 'cashier', 'warehouse'],
      requiredCollections: ['suppliers']
    }
  },
  {
    path: '/purchase-orders',
    name: 'purchase-orders',
    component: () => import('../views/PurchaseOrders.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin', 'cashier', 'warehouse'],
      requiredCollections: ['purchase_orders', 'suppliers']
    }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('../views/Expenses.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cooked-items',
    name: 'CookedItems',
    component: () => import('../views/CookedItems.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin', 'kitchen'],
      requiredCollections: ['kitchen_prep', 'cooked_items', 'raw_materials']
    }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: () => import('../views/Kitchen.vue'),
    meta: { 
      requiresAuth: true,
      allowedRoles: ['superadmin', 'admin', 'kitchen'],
      requiredCollections: ['kitchen_prep', 'cooked_items', 'raw_materials']
    }
  },
  // 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication and authorization
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (requiresAuth && authStore.isAuthenticated) {
    // Validate session first if coming from external link or after some time
    if (from.name === null) {
      const isValid = await authStore.validateSession()
      if (!isValid) {
        next({ name: 'login', query: { redirect: to.fullPath } })
        return
      }
    }
    
    // Check role-based access
    const roleName = authStore.role?.name?.toLowerCase() || ''
    // Normalisasi nama role (hapus spasi, ubah ke lowercase)
    const userRole = roleName.replace(/\s+/g, '').toLowerCase()
    const allowedRoles = to.meta.allowedRoles
    
    // Check required collections if defined in route meta
    const requiredCollections = to.meta.requiredCollections
    
    if (requiredCollections && requiredCollections.length > 0) {
      // Check if user has permission for all required collections
      const hasPermissions = authStore.hasPermissionForAll(requiredCollections, 'read')
      
      if (!hasPermissions) {
        console.warn(`User lacks permissions for route ${to.path}. Required collections:`, requiredCollections)
        next({ name: 'dashboard' })
        return
      }
    }
    
    if (allowedRoles) {
      // Periksa apakah role pengguna diizinkan
      const hasAccess = allowedRoles.some(role => {
        const normalizedRole = role.replace(/\s+/g, '').toLowerCase()
        return normalizedRole === userRole || 
               userRole.includes(normalizedRole) || 
               normalizedRole.includes(userRole)
      })
      
      if (!hasAccess) {
        // Redirect to dashboard if user doesn't have required role
        next({ name: 'dashboard' })
      } else {
        next()
      }
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router