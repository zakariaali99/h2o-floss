import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RootLayout } from './RootLayout'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { AdminLoginPage } from '../pages/AdminLogin'
import { CartPage } from '../pages/Cart'
import { CategoryDetailPage } from '../pages/CategoryDetail'
import { CheckoutPage } from '../pages/Checkout'
import { ContactPage } from '../pages/Contact'
import { Experience3DPage } from '../pages/Experience3D'
import { Home } from '../pages/Home'
import { OrderSuccessPage } from '../pages/OrderSuccess'
import { PartsPage } from '../pages/Parts'
import { ProductDetailPage } from '../pages/ProductDetail'
import { TrackOrderPage } from '../pages/TrackOrder'
import { DashboardLayout } from '../pages/dashboard/DashboardLayout'
import { OrdersSection } from '../pages/dashboard/OrdersSection'
import { ProductsSection } from '../pages/dashboard/ProductsSection'
import { CustomersSection } from '../pages/dashboard/CustomersSection'
import { SettingsSection } from '../pages/dashboard/SettingsSection'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'parts', element: <PartsPage /> },
      { path: 'category/:slug', element: <CategoryDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order/:number', element: <OrderSuccessPage /> },
      { path: 'track', element: <TrackOrderPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: '3d-experience', element: <Experience3DPage /> },
      { path: 'login', element: <AdminLoginPage /> },
      { path: 'admin-login', element: <AdminLoginPage /> },
      { path: 'admin-dashboard', element: <Navigate to="/dashboard" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <OrdersSection /> },
      { path: 'products', element: <ProductsSection /> },
      { path: 'customers', element: <CustomersSection /> },
      { path: 'settings', element: <SettingsSection /> },
    ],
  },
])
