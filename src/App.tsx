import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
