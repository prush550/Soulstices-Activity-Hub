import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Profile() {
  const { userProfile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    bio: userProfile?.bio || '',
    phone: userProfile?.phone || ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [myActivities, setMyActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [myGroups, setMyGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)

  useEffect(() => {
    if (userProfile) {
      fetchMyActivities()
      fetchMyGroups()
    }
  }, [userProfile])

  const fetchMyActivities = async () => {
    try {
      setActivitiesLoading(true)

      const { data, error } = await supabase
        .from('activity_participants')
        .select(`
          id,
          status,
          registered_at,
          activities:activity_id (
            id,
            title,
            date,
            start_time,
            end_time,
            place,
            payment,
            type,
            groups:group_id (
              name
            )
          )
        `)
        .eq('user_id', userProfile.id)
        .eq('status', 'registered')
        .order('registered_at', { ascending: false })

      if (error) throw error

      // Transform the data
      const transformedActivities = data.map(item => ({
        participationId: item.id,
        registeredAt: item.registered_at,
        ...item.activities,
        groupName: item.activities?.groups?.name || 'Unknown Group'
      }))

      setMyActivities(transformedActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setActivitiesLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (time) => {
    if (!time) return 'TBA'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const fetchMyGroups = async () => {
    try {
      setGroupsLoading(true)

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          status,
          joined_at,
          groups:group_id (
            id,
            name,
            description,
            category,
            joining_type,
            member_count
          )
        `)
        .eq('user_id', userProfile.id)
        .eq('status', 'approved')
        .order('joined_at', { ascending: false })

      if (error) throw error

      // Transform the data
      const transformedGroups = data.map(item => ({
        membershipId: item.id,
        joinedAt: item.joined_at,
        ...item.groups
      }))

      setMyGroups(transformedGroups)
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    const { error } = await updateProfile(formData)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const getRoleBadge = () => {
    const roleColors = {
      founder: 'bg-gold/15 text-gold border-gold/30',
      group_admin: 'bg-emerald/15 text-emerald border-emerald/30',
      member: 'bg-emerald/15 text-emerald border-emerald/30'
    }

    const roleLabels = {
      founder: '👑 Founder',
      group_admin: '⚡ Group Admin',
      member: '✨ Member'
    }

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${roleColors[userProfile?.role]}`}>
        {roleLabels[userProfile?.role]}
      </span>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 fade-in-up">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">My Profile</h1>
        <p className="text-text-secondary">Manage your account settings and preferences</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="glass rounded-2xl p-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-gradient-brand rounded-full flex items-center justify-center text-3xl font-bold text-text-primary mb-3 shadow-button">
                {userProfile?.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                {userProfile?.name}
              </h3>
              <p className="text-text-secondary text-sm mb-3">{userProfile?.email}</p>
              {getRoleBadge()}
            </div>

            {/* Stats */}
            <div className="border-t border-emerald/10 pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Joined</span>
                <span className="text-text-primary text-sm font-medium">
                  {new Date(userProfile?.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Groups</span>
                <span className="text-text-primary text-sm font-medium">{myGroups.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Activities</span>
                <span className="text-text-primary text-sm font-medium">{myActivities.length}</span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg font-medium border border-red-500/50 transition-all hover:-translate-y-1"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-bold text-text-primary">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-emerald hover:text-emerald-light font-medium transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/50 text-green-400' 
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-dark-card border border-emerald/20 rounded-lg text-text-primary focus:outline-none focus:border-emerald transition-all"
                  />
                ) : (
                  <p className="text-text-primary">{userProfile?.name}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <p className="text-text-primary">{userProfile?.email}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-2 bg-dark-card border border-emerald/20 rounded-lg text-text-primary focus:outline-none focus:border-emerald transition-all"
                  />
                ) : (
                  <p className="text-text-primary">{userProfile?.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-2 bg-dark-card border border-emerald/20 rounded-lg text-text-primary focus:outline-none focus:border-emerald resize-none transition-all"
                  />
                ) : (
                  <p className="text-text-primary">{userProfile?.bio || 'No bio added yet'}</p>
                )}
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-emerald text-text-primary py-2 rounded-lg font-medium shadow-button hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: userProfile?.name || '',
                        bio: userProfile?.bio || '',
                        phone: userProfile?.phone || ''
                      })
                      setMessage({ type: '', text: '' })
                    }}
                    className="flex-1 bg-dark-card-hover hover:bg-dark-card text-text-primary py-2 rounded-lg font-medium border border-emerald/20 hover:-translate-y-1 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* My Groups */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-text-primary mb-4">My Groups</h2>

            {groupsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading your groups...</p>
              </div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-text-secondary">No groups yet</p>
                <p className="text-sm text-text-muted mt-2">
                  Join groups to connect with communities
                </p>
                <button
                  onClick={() => navigate('/groups')}
                  className="mt-4 bg-gradient-emerald text-text-primary px-6 py-2 rounded-lg font-medium shadow-button hover:-translate-y-1 transition-all"
                >
                  Browse Groups
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myGroups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-dark-card border border-emerald/10 rounded-lg p-4 hover:border-emerald/30 hover:-translate-y-1 transition-all cursor-pointer"
                    onClick={() => navigate(`/group/${group.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-lg font-bold text-text-primary">
                        {group.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded border ${
                        group.joining_type === 'public'
                          ? 'bg-emerald/15 text-emerald border-emerald/30'
                          : group.joining_type === 'invite_only'
                          ? 'bg-gold/15 text-gold border-gold/30'
                          : 'bg-gold/15 text-gold border-gold/30'
                      }`}>
                        {group.joining_type === 'public' && '🌍'}
                        {group.joining_type === 'invite_only' && '🎫'}
                        {group.joining_type === 'screening' && '📋'}
                      </span>
                    </div>

                    <span className="inline-block text-xs text-emerald mb-2">
                      {group.category}
                    </span>

                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                      {group.description}
                    </p>

                    <div className="flex items-center justify-between text-sm border-t border-emerald/10 pt-3">
                      <span className="text-text-secondary">
                        👥 {group.member_count || 0} members
                      </span>
                      <span className="text-xs text-text-muted">
                        Joined {formatDate(group.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Activities */}
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-xl font-bold text-text-primary mb-4">My Activities</h2>

            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading your activities...</p>
              </div>
            ) : myActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-text-secondary">No activities yet</p>
                <p className="text-sm text-text-muted mt-2">
                  Activities you join will appear here
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-gradient-emerald text-text-primary px-6 py-2 rounded-lg font-medium shadow-button hover:-translate-y-1 transition-all"
                >
                  Browse Activities
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="bg-dark-card border border-emerald/10 rounded-lg p-4 hover:border-emerald/30 hover:-translate-y-1 transition-all cursor-pointer"
                    onClick={() => navigate(`/activity/${activity.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display text-lg font-bold text-text-primary">
                        {activity.title}
                      </h3>
                      <span className="text-xs text-text-muted ml-2">
                        {activity.type === 'public' && '🌍 Public'}
                        {activity.type === 'private' && '🔒 Private'}
                        {activity.type === 'invite_only' && '🎫 Invite-Only'}
                      </span>
                    </div>

                    <p className="text-sm text-text-secondary mb-3">
                      Organized by <span className="text-emerald">{activity.groupName}</span>
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <span>📅</span>
                        <span>{formatDate(activity.date)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <span>⏰</span>
                        <span>{formatTime(activity.start_time)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <span>📍</span>
                        <span className="truncate">{activity.place}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-text-secondary">
                        <span>💰</span>
                        <span>{activity.payment}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald/10">
                      <p className="text-xs text-text-muted">
                        Joined on {formatDate(activity.registeredAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile