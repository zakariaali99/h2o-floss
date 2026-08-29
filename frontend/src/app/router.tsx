import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RootLayout } from './RootLayout'
import { Home } from '../pages/Home'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      // P5-P7: /product/:slug, /parts, /category/:slug, /cart, /checkout, /order/:number, /track, /contact
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
