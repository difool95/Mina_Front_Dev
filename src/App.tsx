import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom'

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

// `/add-account` is the same login screen as `/`, but it is only shown when
// the user is already signed in and is adding a new account. The `from` state
// is the ID of the account that was active when the user clicked "Add account".
function AddAccountRoute() {
  const { session, loading } = useAuth()
  const from = (useLocation().state as { from?: string } | null)?.from

  if (loading) return null
  if (session && session.user.id !== from) return <Navigate to="/" replace />

  return <HomePage />
}

const router = createBrowserRouter([
  { path: '/', element: <RootRoute /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/add-account', element: <AddAccountRoute /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
