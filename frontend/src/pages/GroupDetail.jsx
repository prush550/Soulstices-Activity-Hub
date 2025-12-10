import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function GroupDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()

  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [membershipStatus, setMembershipStatus] = useState(null)
  const [isJoining, setIsJoining] = useState(false)

  // Modals
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [showScreeningModal, setShowScreeningModal] = useState(false)
  const [screeningForm, setScreeningForm] = useState({})

  // Activities state
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0], // Today
    endDate: '' // No end date initially (show all future)
  })
  const [showDateFilter, setShowDateFilter] = useState(false)

  useEffect(() => {
    fetchGroup()
  }, [id])

  useEffect(() => {
    if (user && group) {
      checkMembershipStatus()
    }
  }, [user, group])

  useEffect(() => {
    if (group) {
      fetchActivities()
    }
  }, [group, dateFilter, membershipStatus])

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setGroup(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching group:', error)
      setLoading(false)
    }
  }

  const checkMembershipStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id, status')
        .eq('group_id', id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking membership:', error)
        return
      }

      setMembershipStatus(data?.status || null)
    } catch (error) {
      console.error('Error checking membership:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true)

      // Build query
      let query = supabase
        .from('activities')
        .select('*')
        .eq('group_id', id)
        .gte('date', dateFilter.startDate)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      // Apply end date filter if set
      if (dateFilter.endDate) {
        query = query.lte('date', dateFilter.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // Filter based on privacy settings
      let filteredActivities = data || []

      // For private groups, only show activities to members
      if (group.joining_type !== 'public') {
        if (membershipStatus !== 'approved') {
          // Not a member - don't show any activities
          filteredActivities = []
        }
      }

      setActivities(filteredActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!user) {
      alert('Please sign in to join this group')
      navigate('/signin')
      return
    }

    // Handle different joining types
    if (group.joining_type === 'invite_only') {
      setShowInviteCodeModal(true)
      return
    }

    if (group.joining_type === 'screening') {
      // Parse screening form if it exists
      if (group.screening_form) {
        try {
          const formFields = typeof group.screening_form === 'string'
            ? JSON.parse(group.screening_form)
            : group.screening_form
          setScreeningForm(formFields)
        } catch (e) {
          console.error('Error parsing screening form:', e)
          setScreeningForm({})
        }
      }
      setShowScreeningModal(true)
      return
    }

    // For public groups, join directly
    await joinGroup()
  }

  const joinGroup = async (inviteCode = null, applicationData = null) => {
    setIsJoining(true)

    try {
      // For invite-only groups, validate invite code
      if (group.joining_type === 'invite_only') {
        if (!inviteCode) {
          alert('Invite code is required')
          setIsJoining(false)
          return
        }
        if (inviteCode.toUpperCase() !== group.invite_code) {
          alert('Invalid invite code. Please check and try again.')
          setIsJoining(false)
          return
        }
      }

      // Determine initial status based on joining type
      const status = group.joining_type === 'public' || group.joining_type === 'invite_only'
        ? 'approved'
        : 'pending'

      // Insert membership record
      const { error: insertError } = await supabase
        .from('group_members')
        .insert({
          group_id: id,
          user_id: user.id,
          status: status,
          application_data: applicationData
        })

      if (insertError) {
        if (insertError.code === '23505') {
          alert('You have already applied to join this group!')
        } else if (insertError.code === '42501') {
          alert('Database permission error. Please ensure the group joining setup is complete. Contact admin if this persists.')
          console.error('RLS Policy Error:', insertError)
        } else {
          console.error('Insert Error:', insertError)
          throw insertError
        }
        setIsJoining(false)
        return
      }

      // Success! Update UI
      setMembershipStatus(status)
      setShowInviteCodeModal(false)
      setShowScreeningModal(false)
      setInviteCodeInput('')

      // Refresh group data
      await fetchGroup()

      if (status === 'approved') {
        alert('Successfully joined the group! 🎉')
      } else {
        alert('Application submitted! The group admin will review your request.')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) {
      return
    }

    setIsJoining(true)

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', id)
        .eq('user_id', user.id)

      if (error) throw error

      // Success! Update UI
      setMembershipStatus(null)

      // Refresh group data
      await fetchGroup()

      alert('You have left the group.')
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Failed to leave group. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleInviteCodeSubmit = () => {
    if (!inviteCodeInput.trim()) {
      alert('Please enter an invite code')
      return
    }
    joinGroup(inviteCodeInput.trim())
  }

  const handleScreeningSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const applicationData = {}

    formData.forEach((value, key) => {
      applicationData[key] = value
    })

    joinGroup(null, applicationData)
  }

  const getJoinButtonContent = () => {
    if (!user) {
      return { text: 'Sign In to Join', disabled: false, onClick: () => navigate('/signin') }
    }

    if (membershipStatus === 'approved') {
      return {
        text: '✓ Member - Click to Leave',
        disabled: isJoining,
        onClick: handleLeaveGroup,
        className: 'bg-gradient-emerald shadow-button hover:bg-red-600'
      }
    }

    if (membershipStatus === 'pending') {
      return {
        text: '⏳ Application Pending',
        disabled: true,
        onClick: null,
        className: 'bg-gold/20 border border-gold/30 cursor-not-allowed'
      }
    }

    if (membershipStatus === 'rejected') {
      return {
        text: '❌ Application Rejected',
        disabled: true,
        onClick: null,
        className: 'bg-red-600 cursor-not-allowed'
      }
    }

    // Not a member yet
    const joinText = {
      public: 'Join Group',
      invite_only: '🎫 Join with Invite Code',
      screening: '📋 Apply to Join'
    }

    return {
      text: isJoining ? 'Processing...' : joinText[group.joining_type],
      disabled: isJoining,
      onClick: handleJoinGroup,
      className: 'bg-gradient-emerald shadow-button'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading group details...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-4">Group Not Found</h2>
          <button
            onClick={() => navigate('/groups')}
            className="bg-gradient-emerald shadow-button text-text-primary px-6 py-3 rounded-lg font-medium hover:-translate-y-1 transition-all"
          >
            Back to Groups
          </button>
        </div>
      </div>
    )
  }

  const buttonConfig = getJoinButtonContent()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center space-x-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <span>←</span>
        <span>Back to Groups</span>
      </button>

      {/* Header Section */}
      <div className="glass rounded-2xl border border-emerald/10 p-8 mb-6">
        {/* Group Icon */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center text-4xl">
              {group.category?.includes('Badminton') && '🏸'}
              {group.category?.includes('Fitness') && '💪'}
              {group.category?.includes('Football') && '⚽'}
              {group.category?.includes('Yoga') && '🧘'}
              {group.category?.includes('Cycling') && '🚴'}
              {group.category?.includes('Multi-Sport') && '🏆'}
              {!group.category && '👥'}
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
                {group.name}
              </h1>
              <span className="inline-block bg-emerald/15 border border-emerald/30 text-emerald px-4 py-1 rounded-full text-[11px] uppercase font-medium tracking-wide">
                {group.category || 'Community'}
              </span>
            </div>
          </div>

          {/* Joining Type Badge */}
          <div>
            {group.joining_type === 'public' && (
              <span className="bg-emerald/15 border border-emerald/30 text-emerald px-4 py-2 rounded-full text-sm font-medium">
                🌍 Public
              </span>
            )}
            {group.joining_type === 'invite_only' && (
              <span className="bg-gold/15 border border-gold/30 text-gold px-4 py-2 rounded-full text-sm font-medium">
                🎫 Invite-Only
              </span>
            )}
            {group.joining_type === 'screening' && (
              <span className="bg-gold/15 border border-gold/30 text-gold px-4 py-2 rounded-full text-sm font-medium">
                📋 Screening
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-1 tracking-wide">👥 MEMBERS</div>
            <div className="text-text-primary font-bold text-2xl">{group.member_count || 0}</div>
          </div>
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-1 tracking-wide">📅 CREATED</div>
            <div className="text-text-primary font-bold text-lg">
              {new Date(group.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-1 tracking-wide">🔓 ACCESS</div>
            <div className="text-text-primary font-bold text-lg capitalize">
              {group.joining_type?.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Join Button */}
        <button
          onClick={buttonConfig.onClick}
          disabled={buttonConfig.disabled}
          className={`w-full py-4 rounded-xl font-bold text-lg text-text-primary transition-all ${
            buttonConfig.className || 'bg-gray-600 cursor-not-allowed'
          } ${!buttonConfig.disabled ? 'hover:-translate-y-1' : ''}`}
        >
          {buttonConfig.text}
        </button>
      </div>

      {/* Description */}
      {group.description && (
        <div className="glass rounded-2xl border border-emerald/10 p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">About This Group</h2>
          <p className="text-text-secondary leading-relaxed">{group.description}</p>
        </div>
      )}

      {/* Activities Section */}
      <div className="glass rounded-2xl border border-emerald/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            {group.joining_type === 'public' ? 'Upcoming Activities' : 'Group Activities'}
          </h2>
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className="flex items-center space-x-2 bg-gradient-emerald shadow-button text-text-primary px-4 py-2 rounded-lg font-medium hover:-translate-y-1 transition-all"
          >
            <span>📅</span>
            <span>{showDateFilter ? 'Hide Filter' : 'Filter by Date'}</span>
          </button>
        </div>

        {/* Date Filter */}
        {showDateFilter && (
          <div className="bg-dark-card border border-emerald/20 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                  className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:border-emerald transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                  min={dateFilter.startDate}
                  className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:border-emerald transition-colors"
                  placeholder="Leave empty for all future"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setDateFilter({
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ''
                  })
                }}
                className="text-sm text-emerald hover:text-gold font-medium transition-colors"
              >
                Reset to Today
              </button>
            </div>
          </div>
        )}

        {/* Privacy Notice for Non-Members */}
        {group.joining_type !== 'public' && membershipStatus !== 'approved' && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-display text-lg font-bold text-gold mb-2">
              Members Only Activities
            </h3>
            <p className="text-text-secondary mb-4">
              Join this group to view and participate in exclusive activities.
            </p>
            <button
              onClick={handleJoinGroup}
              className="bg-gradient-emerald shadow-button text-text-primary px-6 py-2 rounded-lg font-medium hover:-translate-y-1 transition-all"
            >
              {group.joining_type === 'invite_only' ? '🎫 Join with Invite Code' : '📋 Apply to Join'}
            </button>
          </div>
        )}

        {/* Activities Loading */}
        {activitiesLoading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-muted">Loading activities...</p>
          </div>
        )}

        {/* Activities List */}
        {!activitiesLoading && (group.joining_type === 'public' || membershipStatus === 'approved') && (
          <>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                  No Activities Scheduled
                </h3>
                <p className="text-text-muted">
                  {dateFilter.endDate
                    ? 'No activities found in the selected date range.'
                    : 'No upcoming activities at the moment. Check back later!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => navigate(`/activity/${activity.id}`)}
                    className="bg-dark-bg border border-emerald/10 rounded-2xl p-6 hover:border-emerald hover:shadow-lg hover:shadow-emerald/10 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold text-text-primary mb-2 group-hover:text-emerald transition-colors">
                          {activity.title}
                        </h3>
                        <p className="text-text-muted text-sm mb-3 line-clamp-2">
                          {activity.description}
                        </p>
                      </div>
                      <div className="ml-4">
                        {activity.type === 'public' && (
                          <span className="bg-emerald/15 border border-emerald/30 text-emerald text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide">
                            🌍 Public
                          </span>
                        )}
                        {activity.type === 'private' && (
                          <span className="bg-emerald/15 border border-emerald/30 text-emerald text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide">
                            🔒 Private
                          </span>
                        )}
                        {activity.type === 'invite_only' && (
                          <span className="bg-gold/15 border border-gold/30 text-gold text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide">
                            🎫 Invite-Only
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-emerald">📅</span>
                        <span className="text-text-secondary">
                          {new Date(activity.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-emerald">🕐</span>
                        <span className="text-text-secondary">
                          {activity.start_time} - {activity.end_time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-emerald">📍</span>
                        <span className="text-text-secondary truncate">{activity.place}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-emerald">💰</span>
                        <span className="text-text-secondary">{activity.payment}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-emerald/10">
                      <div className="flex items-center space-x-4 text-sm text-text-muted">
                        <span>
                          👥 {activity.current_participants || 0}
                          {activity.participant_limit && ` / ${activity.participant_limit}`} joined
                        </span>
                      </div>
                      <button className="text-emerald hover:text-gold font-medium text-sm group-hover:translate-x-1 transition-transform">
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Code Modal */}
      {showInviteCodeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-emerald/10 p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">🎫 Enter Invite Code</h3>

            <p className="text-text-muted mb-4">
              This is an invite-only group. Please enter the invite code you received from the group admin.
            </p>

            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="Enter invite code"
              className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-emerald uppercase tracking-wider text-center text-lg font-mono transition-colors"
              maxLength={8}
              autoFocus
            />

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowInviteCodeModal(false)
                  setInviteCodeInput('')
                }}
                className="flex-1 bg-dark-hover hover:bg-dark-border text-text-primary py-3 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteCodeSubmit}
                disabled={isJoining || !inviteCodeInput.trim()}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  isJoining || !inviteCodeInput.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-emerald shadow-button text-text-primary hover:-translate-y-1'
                }`}
              >
                {isJoining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screening Modal */}
      {showScreeningModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass rounded-2xl border border-emerald/10 p-6 max-w-md w-full my-8">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">📋 Application Form</h3>

            <p className="text-text-muted mb-6">
              Please fill out this form to apply to join this group. The group admin will review your application.
            </p>

            <form onSubmit={handleScreeningSubmit} className="space-y-4">
              {/* Default questions */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Why do you want to join this group? *
                </label>
                <textarea
                  name="reason"
                  required
                  rows="3"
                  className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:border-emerald resize-none transition-colors"
                  placeholder="Tell us why you're interested..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Tell us about your experience *
                </label>
                <textarea
                  name="experience"
                  required
                  rows="3"
                  className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:border-emerald resize-none transition-colors"
                  placeholder="Your experience with this activity..."
                />
              </div>

              {/* Custom screening questions if any */}
              {screeningForm && Object.keys(screeningForm).length > 0 && (
                Object.entries(screeningForm).map(([key, question]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {question}
                    </label>
                    <input
                      type="text"
                      name={key}
                      className="w-full bg-dark-card border border-emerald/20 text-text-primary px-4 py-2 rounded-lg focus:outline-none focus:border-emerald transition-colors"
                    />
                  </div>
                ))
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowScreeningModal(false)}
                  className="flex-1 bg-dark-hover hover:bg-dark-border text-text-primary py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                    isJoining
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-emerald shadow-button text-text-primary hover:-translate-y-1'
                  }`}
                >
                  {isJoining ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign In Prompt */}
      {!user && (
        <div className="bg-gradient-emerald/10 border border-emerald/30 rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold text-text-primary mb-2">
            Need to sign in
          </h3>
          <p className="text-text-secondary text-sm">
            Create an account or sign in to join this group and access exclusive activities.
          </p>
        </div>
      )}
    </div>
  )
}

export default GroupDetail
