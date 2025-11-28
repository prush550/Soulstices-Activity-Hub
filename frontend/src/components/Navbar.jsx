import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="bg-dark-card border-b border-dark-border sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-lg flex items-center justify-center group-hover:scale-110">
              <span className="text-white font-display text-xl font-bold">S</span>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-white group-hover:text-accent-primary">
                Soulstices
              </h1>
              <p className="text-xs text-gray-400">Activity Hub</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`font-medium px-3 py-2 rounded-md ${
                isActive('/')
                  ? 'text-accent-primary bg-dark-hover'
                  : 'text-gray-300 hover:text-white hover:bg-dark-hover'
              }`}
            >
              Home
            </Link>
            <Link
              to="/groups"
              className={`font-medium px-3 py-2 rounded-md ${
                isActive('/groups')
                  ? 'text-accent-primary bg-dark-hover'
                  : 'text-gray-300 hover:text-white hover:bg-dark-hover'
              }`}
            >
              Groups
            </Link>
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400 hidden md:block">📍 Bhopal, MP</span>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-dark-hover hover:bg-dark-border px-4 py-2 rounded-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-secondary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {userProfile?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white hidden md:block">{userProfile?.name}</span>
                  <span className="text-gray-400">▼</span>
                </button>

                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-lg shadow-lg z-20">
                      <div className="p-4 border-b border-dark-border">
                        <p className="text-white font-medium">{userProfile?.name}</p>
                        <p className="text-gray-400 text-sm">{userProfile?.email}</p>
                        {userProfile?.role === 'founder' && (
                          <span className="inline-block mt-2 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">
                            👑 Founder
                          </span>
                        )}
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-hover hover:text-white"
                        >
                          👤 My Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/my-activities')
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-hover hover:text-white"
                        >
                          📅 My Activities
                        </button>
                        {userProfile?.role === 'founder' && (
                          <button
                            onClick={() => {
                              navigate('/founder-dashboard')
                              setShowUserMenu(false)
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-hover hover:text-white"
                          >
                            ⚡ Founder Dashboard
                          </button>
                        )}
                        {(userProfile?.role === 'group_admin' || userProfile?.isAlsoGroupAdmin) && (
                          <button
                            onClick={() => {
                              navigate('/group-admin-dashboard')
                              setShowUserMenu(false)
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-dark-hover hover:text-white"
                          >
                            🎯 Group Admin Dashboard
                          </button>
                        )}
                      </div>
                      <div className="border-t border-dark-border py-2">
                        <button
                          onClick={async () => {
                            await signOut()
                            setShowUserMenu(false)
                            navigate('/')
                          }}
                          className="w-full text-left px-4 py-2 text-red-400 hover:bg-dark-hover"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-gray-300 hover:text-white px-4 py-2 rounded-md font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-md font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar