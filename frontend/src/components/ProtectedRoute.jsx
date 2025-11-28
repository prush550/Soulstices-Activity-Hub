import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children, requiredRole }) {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (requiredRole) {
    // Check if user has the required role
    let hasAccess = userProfile?.role === requiredRole

    // Special case: Allow access to group_admin dashboard if user is in group_admins table
    if (requiredRole === 'group_admin' && userProfile?.isAlsoGroupAdmin) {
      hasAccess = true
    }

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">
              Access Denied
            </h2>
            <p className="text-gray-400 mb-6">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-accent-primary hover:bg-accent-secondary text-white px-6 py-3 rounded-md font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute