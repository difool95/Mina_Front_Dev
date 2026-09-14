import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AuthCallbackPage } from '@/pages/AuthCallbackPage'
import { HomePage } from '@/pages/HomePage'
import { ProfilePage } from '@/pages/ProfilePage'
import { StudioPage } from '@/pages/StudioPage'
import { useAuth } from '@/providers/AuthProvider'

/**
 * `/` is the login screen signed out and the studio signed in — two separate
 * pages behind one path, so the choice belongs here rather than inside either
 * of them.
 */
function RootRoute() {
  const { session, loading } = useAuth()

  // Nothing until the stored session has been read, so login cannot flash up
  // in front of an already signed-in user.
  if (loading) return null

  return session ? <StudioPage /> : <HomePage />
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
