import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Logo from './Logo'

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className="glass sticky top-0 z-50 border-b border-emerald/10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="group transition-transform hover:scale-105">
            <Logo size="default" />
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-2">
            <Link
              to="/"
              className={`font-body text-[15px] font-normal tracking-[0.3px] px-4 py-2 rounded-lg transition-all relative ${
                isActive('/')
                  ? 'text-emerald'
                  : 'text-text-secondary hover:text-emerald'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand"></span>
              )}
            </Link>
            <Link
              to="/groups"
              className={`font-body text-[15px] font-normal tracking-[0.3px] px-4 py-2 rounded-lg transition-all relative ${
                isActive('/groups')
                  ? 'text-emerald'
                  : 'text-text-secondary hover:text-emerald'
              }`}
            >
              Groups
              {isActive('/groups') && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-brand"></span>
              )}
            </Link>
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-text-muted hidden md:block">📍 Bhopal, MP</span>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 glass hover:border-emerald/30 px-4 py-2 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center text-dark-bg font-bold text-sm">
                    {userProfile?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-text-primary hidden md:block font-body">{userProfile?.name}</span>
                  <span className="text-text-secondary text-xs">▼</span>
                </button>

                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-card z-20">
                      <div className="p-4 border-b border-emerald/10">
                        <p className="text-text-primary font-medium font-body">{userProfile?.name}</p>
                        <p className="text-text-secondary text-sm">{userProfile?.email}</p>
                        {userProfile?.role === 'founder' && (
                          <span className="inline-block mt-2 bg-emerald/15 border border-emerald/30 text-emerald text-[11px] px-3 py-1 rounded-full">
                            👑 FOUNDER
                          </span>
                        )}
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            navigate('/profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-text-secondary hover:bg-dark-card-hover hover:text-emerald font-body text-sm"
                        >
                          👤 My Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/my-activities')
                            setShowUserMenu(false)
                          }}
                          className="w-full text-left px-4 py-2 text-text-secondary hover:bg-dark-card-hover hover:text-emerald font-body text-sm"
                        >
                          📅 My Activities
                        </button>
                        {userProfile?.role === 'founder' && (
                          <button
                            onClick={() => {
                              navigate('/founder-dashboard')
                              setShowUserMenu(false)
                            }}
                            className="w-full text-left px-4 py-2 text-text-secondary hover:bg-dark-card-hover hover:text-emerald font-body text-sm"
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
                            className="w-full text-left px-4 py-2 text-text-secondary hover:bg-dark-card-hover hover:text-emerald font-body text-sm"
                          >
                            🎯 Group Admin Dashboard
                          </button>
                        )}
                      </div>
                      <div className="border-t border-emerald/10 py-2">
                        <button
                          onClick={async () => {
                            await signOut()
                            setShowUserMenu(false)
                            navigate('/')
                          }}
                          className="w-full text-left px-4 py-2 text-red-400 hover:bg-dark-card-hover font-body text-sm"
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
                  className="text-text-secondary hover:text-emerald px-4 py-2 rounded-lg font-body font-normal transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-emerald text-dark-bg px-6 py-2.5 rounded-lg font-body font-medium shadow-button hover:shadow-lg hover:-translate-y-0.5 transition-all"
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