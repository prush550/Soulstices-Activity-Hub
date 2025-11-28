import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import ActivityDetail from './pages/ActivityDetail'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Profile from './pages/Profile'
import FounderDashboard from './pages/FounderDashboard'
import GroupAdminDashboard from './pages/GroupAdminDashboard'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-dark-bg">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/group/:id" element={<GroupDetail />} />
            <Route path="/activity/:id" element={<ActivityDetail />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/founder-dashboard"
              element={
                <ProtectedRoute requiredRole="founder">
                  <FounderDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/group-admin-dashboard"
              element={
                <ProtectedRoute requiredRole="group_admin">
                  <GroupAdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App