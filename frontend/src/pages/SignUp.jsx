import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/\d/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name')
      return
    }

    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { data, error } = await signUp(formData.email, formData.password, formData.name)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full glass rounded-2xl p-8 text-center fade-in-up">
          <div className="w-16 h-16 bg-emerald/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl text-emerald">✓</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-4">
            Check Your Email!
          </h2>
          <p className="text-text-secondary mb-6">
            We've sent a verification link to <span className="text-text-primary font-semibold">{formData.email}</span>.
            Please check your email and click the link to verify your account.
          </p>
          <p className="text-sm text-text-muted mb-6">
            Didn't receive the email? Check your spam folder.
          </p>
          <Link
            to="/signin"
            className="inline-block bg-gradient-emerald text-text-primary px-6 py-3 rounded-lg font-medium shadow-button hover:-translate-y-1 transition-all"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
            Join Soulstices
          </h1>
          <p className="text-text-secondary">
            Discover and join amazing activities in Bhopal
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-card border border-emerald/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald transition-all"
                placeholder="Enter your name"
              />
            </div>

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
                placeholder="At least 8 characters with a number"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-card border border-emerald/20 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-emerald transition-all"
                placeholder="Re-enter your password"
              />
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <Link to="/signin" className="text-emerald hover:text-emerald-light font-medium transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="mt-6 glass rounded-lg p-4">
          <p className="text-sm font-medium text-text-secondary mb-2">Password Requirements:</p>
          <ul className="text-sm text-text-muted space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains at least one number</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SignUp