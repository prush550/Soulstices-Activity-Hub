import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await signIn(formData.email, formData.password)

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email address. Check your inbox for the verification link.')
      } else if (error.message.includes('Invalid login credentials')) {
        setError('Invalid email or password')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Successful login
    navigate(from, { replace: true })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Sign in to your Soulstices account
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-card border border-emerald/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald transition-all"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-card border border-emerald/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald transition-all"
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-emerald bg-dark-bg border-emerald/20 rounded focus:ring-emerald"
                />
                <span className="ml-2 text-sm text-text-secondary">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-emerald hover:text-emerald-light transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-emerald text-text-primary py-3 rounded-lg font-bold shadow-button hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-emerald hover:text-emerald-light font-medium transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-emerald/15 border border-emerald/30 rounded-lg p-4">
          <p className="text-sm text-text-secondary text-center">
            First time here? Create an account to join activities and connect with your community!
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn