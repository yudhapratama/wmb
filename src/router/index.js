import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Lazy-loaded route components
const Dashboard = () => import('../views/Dashboard.vue')
const Login = () => import('../views/Login.vue')
const Inventory = () => import('../views/Inventory.vue')
const InventoryCategories = () => import('../views/InventoryCategories.vue')
const Suppliers = () => import('../views/Suppliers.vue') // Add this line
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
    meta: { requiresAuth: true }
  },
  {
    path: '/inventory-categories',
    name: 'inventory-categories',
    component: InventoryCategories,
    meta: { requiresAuth: true }
  },
  {
    path: '/suppliers', // Add this route
    name: 'suppliers',
    component: Suppliers,
    meta: { requiresAuth: true }
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

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router