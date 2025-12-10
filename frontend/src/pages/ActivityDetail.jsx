import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activity, setActivity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false)
  const [inviteCodeInput, setInviteCodeInput] = useState('')
  const [participants, setParticipants] = useState([])
  const [participantsLoading, setParticipantsLoading] = useState(true)
  const [groupInfo, setGroupInfo] = useState(null)
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    fetchActivity()
  }, [id])

  useEffect(() => {
    if (activity) {
      fetchParticipants()
      if (activity.group_id) {
        fetchGroupInfo()
      }
    }
  }, [activity])

  useEffect(() => {
    if (user && activity) {
      checkIfJoined()
      checkGroupMembership()
    }
  }, [user, activity])

  const fetchActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          groups:group_id (
            name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      
      // Transform data to include groupName
      const transformedData = {
        ...data,
        groupName: data.groups?.name || 'Unknown Group'
      }
      
      setActivity(transformedData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching activity:', error)
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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

  const checkIfJoined = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_participants')
        .select('id, status')
        .eq('activity_id', id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking participation:', error)
        return
      }

      setHasJoined(data && data.status === 'registered')
    } catch (error) {
      console.error('Error checking participation:', error)
    }
  }

  const fetchParticipants = async () => {
    try {
      setParticipantsLoading(true)

      const { data, error } = await supabase
        .from('activity_participants')
        .select(`
          id,
          registered_at,
          user:users (
            id,
            name,
            email,
            profile_picture
          )
        `)
        .eq('activity_id', id)
        .eq('status', 'registered')
        .order('registered_at', { ascending: true })

      if (error) {
        console.error('Error fetching participants:', error)
        throw error
      }

      console.log('Fetched participants:', data)
      setParticipants(data || [])
    } catch (error) {
      console.error('Error fetching participants:', error)
      setParticipants([])
    } finally {
      setParticipantsLoading(false)
    }
  }

  const fetchGroupInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description, category, joining_type, member_count')
        .eq('id', activity.group_id)
        .single()

      if (error) throw error

      setGroupInfo(data)
    } catch (error) {
      console.error('Error fetching group info:', error)
    }
  }

  const checkGroupMembership = async () => {
    if (!activity.group_id) return

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id, status')
        .eq('group_id', activity.group_id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking group membership:', error)
        return
      }

      setIsMember(data && data.status === 'approved')
    } catch (error) {
      console.error('Error checking group membership:', error)
    }
  }

  const handleJoinActivity = async () => {
    if (!user) {
      alert('Please sign in to join this activity')
      navigate('/signin')
      return
    }

    // Check if activity type is invite_only
    if (activity.type === 'invite_only') {
      setShowInviteCodeModal(true)
      return
    }

    // For public and private activities, join directly
    await joinActivity()
  }

  const joinActivity = async (providedInviteCode = null) => {
    setIsJoining(true)

    try {
      // Check if activity is full
      if (activity.participant_limit && activity.current_participants >= activity.participant_limit) {
        alert('Sorry, this activity is full!')
        setIsJoining(false)
        return
      }

      // For invite-only activities, validate invite code
      if (activity.type === 'invite_only') {
        if (!providedInviteCode) {
          alert('Invite code is required for this activity')
          setIsJoining(false)
          return
        }
        if (providedInviteCode.toUpperCase() !== activity.invite_code) {
          alert('Invalid invite code. Please check and try again.')
          setIsJoining(false)
          return
        }
      }

      // For private activities, check if user is a group member
      if (activity.type === 'private') {
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', activity.group_id)
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single()

        if (memberError || !memberData) {
          alert('This is a private activity. Only group members can join.')
          setIsJoining(false)
          return
        }
      }

      // Insert participation record
      const { error: insertError } = await supabase
        .from('activity_participants')
        .insert({
          activity_id: id,
          user_id: user.id,
          status: 'registered'
        })

      if (insertError) {
        if (insertError.code === '23505') { // Unique constraint violation
          alert('You have already joined this activity!')
        } else {
          throw insertError
        }
        setIsJoining(false)
        return
      }

      // Success! Update UI
      setHasJoined(true)
      setShowInviteCodeModal(false)
      setInviteCodeInput('')

      // Refresh activity data and participants to get updated information
      await fetchActivity()
      await fetchParticipants()

      alert('Successfully joined the activity! 🎉')
    } catch (error) {
      console.error('Error joining activity:', error)
      alert('Failed to join activity. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveActivity = async () => {
    if (!confirm('Are you sure you want to leave this activity?')) {
      return
    }

    setIsJoining(true)

    try {
      const { error } = await supabase
        .from('activity_participants')
        .delete()
        .eq('activity_id', id)
        .eq('user_id', user.id)

      if (error) throw error

      // Success! Update UI
      setHasJoined(false)

      // Refresh activity data and participants to get updated information
      await fetchActivity()
      await fetchParticipants()

      alert('You have left the activity.')
    } catch (error) {
      console.error('Error leaving activity:', error)
      alert('Failed to leave activity. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleInviteCodeSubmit = () => {
    if (!inviteCodeInput.trim()) {
      alert('Please enter an invite code')
      return
    }
    joinActivity(inviteCodeInput.trim())
  }

  const handleAddToCalendar = () => {
    if (!activity) return

    const startDateTime = `${activity.date}T${activity.start_time}:00`
    const endDateTime = `${activity.date}T${activity.end_time}:00`
    
    const event = {
      text: activity.title,
      dates: `${startDateTime.replace(/[-:]/g, '')}/${endDateTime.replace(/[-:]/g, '')}`,
      details: `${activity.description || ''}\n\nOrganized by: ${activity.groupName}\nPayment: ${activity.payment}`,
      location: activity.place,
    }

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.text)}&dates=${event.dates}&details=${encodeURIComponent(event.details)}&location=${encodeURIComponent(event.location)}`
    
    window.open(googleCalendarUrl, '_blank')
  }

  const handleShare = (platform) => {
    const url = window.location.href
    const text = `Check out this activity: ${activity.title} on Soulstices Activity Hub!`

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const getGoogleMapsEmbedUrl = (place) => {
    const query = encodeURIComponent(`${place}, Bhopal, Madhya Pradesh`)
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${query}`
  }

  const getAvailabilityInfo = () => {
    if (!activity.participant_limit) {
      return { text: 'Unlimited spots', color: 'text-green-400', available: true }
    }
    // Use participants.length for accurate count instead of activity.current_participants
    const currentCount = participants.length
    const spotsLeft = activity.participant_limit - currentCount
    if (spotsLeft === 0) {
      return { text: 'Activity Full', color: 'text-red-400', available: false }
    }
    if (spotsLeft <= 3) {
      return { text: `Only ${spotsLeft} spots left!`, color: 'text-yellow-400', available: true }
    }
    return { text: `${spotsLeft} spots available`, color: 'text-green-400', available: true }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading activity details...</p>
        </div>
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-display font-bold text-text-primary mb-4">Activity Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-emerald shadow-button text-text-primary px-6 py-3 rounded-lg font-medium hover:-translate-y-1 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const availability = getAvailabilityInfo()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-text-muted hover:text-text-primary mb-6 transition-colors"
      >
        <span>←</span>
        <span>Back</span>
      </button>

      {/* Header Section */}
      <div className="glass rounded-2xl border border-emerald/10 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold text-text-primary mb-3">
              {activity.title}
            </h1>
            <p className="text-lg text-text-secondary">
              Organized by <span className="text-emerald font-semibold">{activity.groupName}</span>
            </p>
          </div>
          <div className="flex space-x-3">
            {activity.type === 'private' && (
              <span className="bg-emerald/15 border border-emerald/30 text-emerald px-4 py-2 rounded-full text-sm font-medium">
                🔒 Private Event
              </span>
            )}
            {activity.type === 'invite_only' && (
              <span className="bg-gold/15 border border-gold/30 text-gold px-4 py-2 rounded-full text-sm font-medium">
                🎫 Invite-Only
              </span>
            )}
            {activity.type === 'public' && (
              <span className="bg-emerald/15 border border-emerald/30 text-emerald px-4 py-2 rounded-full text-sm font-medium">
                🌍 Public Event
              </span>
            )}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Date & Time */}
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-2 tracking-wide">📅 DATE & TIME</div>
            <div className="text-text-primary font-medium">{formatDate(activity.date)}</div>
            <div className="text-text-muted text-sm mt-1">
              {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
            </div>
          </div>

          {/* Location */}
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-2 tracking-wide">📍 LOCATION</div>
            <div className="text-text-primary font-medium">{activity.place}</div>
            <div className="text-text-muted text-sm mt-1">Bhopal, Madhya Pradesh</div>
          </div>

          {/* Payment */}
          <div className="bg-dark-bg rounded-xl p-4">
            <div className="text-emerald text-[11px] uppercase font-semibold mb-2 tracking-wide">💰 PAYMENT</div>
            <div className="text-text-primary font-medium text-lg">{activity.payment}</div>
          </div>
        </div>

        {/* Availability Status */}
        <div className={`bg-dark-bg rounded-xl p-4 border-l-4 ${availability.available ? 'border-emerald' : 'border-red-400'}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-text-muted">👥 Participants: </span>
              <span className="text-text-primary font-semibold">
                {participantsLoading ? '...' : participants.length}
              </span>
              {activity.participant_limit && (
                <span className="text-text-muted"> / {activity.participant_limit}</span>
              )}
            </div>
            <span className={`${availability.color} font-semibold`}>
              {availability.text}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        {hasJoined ? (
          <button
            onClick={handleLeaveActivity}
            disabled={isJoining}
            className="flex-1 min-w-[200px] py-4 rounded-xl font-bold text-lg bg-gradient-emerald shadow-button hover:bg-red-600 text-text-primary transition-all hover:-translate-y-1"
          >
            {isJoining ? 'Processing...' : '✓ Joined - Click to Leave'}
          </button>
        ) : (
          <button
            onClick={handleJoinActivity}
            disabled={!availability.available || isJoining}
            className={`flex-1 min-w-[200px] py-4 rounded-xl font-bold text-lg transition-all ${
              availability.available && !isJoining
                ? 'bg-gradient-emerald shadow-button text-text-primary hover:-translate-y-1'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isJoining
              ? 'Joining...'
              : availability.available
                ? activity.type === 'invite_only'
                  ? '🔒 Join with Invite Code'
                  : 'Join This Activity'
                : 'Activity Full'}
          </button>
        )}

        <button
          onClick={handleAddToCalendar}
          className="px-6 py-4 glass border border-emerald/10 hover:border-emerald/30 rounded-xl font-medium text-text-primary transition-all hover:-translate-y-1"
        >
          📅 Add to Calendar
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="px-6 py-4 glass border border-emerald/10 hover:border-emerald/30 rounded-xl font-medium text-text-primary transition-all hover:-translate-y-1"
        >
          🔗 Share
        </button>
      </div>

      {/* Description */}
      {activity.description && (
        <div className="glass rounded-2xl border border-emerald/10 p-6 mb-6">
          <h2 className="font-display text-xl font-bold text-text-primary mb-4">About This Activity</h2>
          <p className="text-text-secondary leading-relaxed">{activity.description}</p>
        </div>
      )}

      {/* Google Maps */}
      <div className="glass rounded-2xl border border-emerald/10 p-6 mb-6">
        <h2 className="font-display text-xl font-bold text-text-primary mb-4">Location</h2>
        <div className="rounded-lg overflow-hidden h-80">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={getGoogleMapsEmbedUrl(activity.place)}
          ></iframe>
        </div>
      </div>

      {/* Group Information */}
      {groupInfo && (
        <div className="glass rounded-2xl border border-emerald/10 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-text-primary mb-2">Organized By</h2>
              <p className="text-text-muted text-sm">Learn more about the group hosting this activity</p>
            </div>
            <button
              onClick={() => navigate(`/group/${groupInfo.id}`)}
              className="bg-gradient-emerald shadow-button text-text-primary px-4 py-2 rounded-lg font-medium text-sm hover:-translate-y-1 transition-all"
            >
              View Group →
            </button>
          </div>

          <div className="bg-dark-bg rounded-xl p-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-brand rounded-xl flex items-center justify-center text-2xl">
                {groupInfo.category === 'Social' && '🎉'}
                {groupInfo.category === 'Sports' && '⚽'}
                {groupInfo.category === 'Cultural' && '🎭'}
                {groupInfo.category === 'Educational' && '📚'}
                {groupInfo.category === 'Professional' && '💼'}
                {groupInfo.category === 'Wellness' && '🧘'}
                {!['Social', 'Sports', 'Cultural', 'Educational', 'Professional', 'Wellness'].includes(groupInfo.category) && '👥'}
              </div>

              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-text-primary mb-1">{groupInfo.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-text-muted mb-2">
                  <span className="flex items-center space-x-1">
                    <span>📁</span>
                    <span>{groupInfo.category}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span>👥</span>
                    <span>{groupInfo.member_count || 0} members</span>
                  </span>
                  {groupInfo.joining_type === 'public' && (
                    <span className="bg-emerald/15 border border-emerald/30 text-emerald px-2 py-1 rounded text-xs font-medium">
                      Public
                    </span>
                  )}
                  {groupInfo.joining_type === 'invite_only' && (
                    <span className="bg-gold/15 border border-gold/30 text-gold px-2 py-1 rounded text-xs font-medium">
                      Invite-Only
                    </span>
                  )}
                  {groupInfo.joining_type === 'screening' && (
                    <span className="bg-emerald/15 border border-emerald/30 text-emerald px-2 py-1 rounded text-xs font-medium">
                      Screening
                    </span>
                  )}
                </div>
                {groupInfo.description && (
                  <p className="text-text-secondary text-sm line-clamp-2">{groupInfo.description}</p>
                )}
                {!isMember && groupInfo.joining_type !== 'public' && (
                  <p className="text-gold text-sm mt-2">
                    ℹ️ This is a {groupInfo.joining_type === 'invite_only' ? 'invite-only' : 'screening'} group. Join the group to access all their activities.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Participants Section */}
      <div className="glass rounded-2xl border border-emerald/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-text-primary">
              Participants {!participantsLoading && participants.length > 0 && `(${participants.length})`}
            </h2>
            <p className="text-text-muted text-sm mt-1">
              {participantsLoading ? (
                'Loading participant count...'
              ) : activity.participant_limit ? (
                `${participants.length} of ${activity.participant_limit} spots filled`
              ) : (
                `${participants.length} participant${participants.length !== 1 ? 's' : ''} registered`
              )}
            </p>
          </div>
        </div>

        {/* Privacy Notice for Private Activities */}
        {activity.type === 'private' && !isMember && (
          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold text-gold mb-1">Private Activity</h3>
                <p className="text-text-secondary text-sm">
                  Only group members can see who has joined this activity. Join the group to view participants.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participant List */}
        {participantsLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-text-muted text-sm">Loading participants...</p>
          </div>
        ) : (activity.type === 'private' && !isMember) ? (
          <div className="text-center py-8 text-text-muted">
            <p>Join the group to see participants</p>
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <div className="text-4xl mb-2">👥</div>
            <p>No participants yet</p>
            <p className="text-sm mt-1">Be the first to join!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {participants.map((participant, index) => (
              <div
                key={participant.id}
                className="bg-dark-bg border border-emerald/10 rounded-xl p-4 hover:border-emerald/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Profile Picture or Avatar */}
                  <div className="flex-shrink-0">
                    {participant.user.profile_picture ? (
                      <img
                        src={participant.user.profile_picture}
                        alt={participant.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-brand flex items-center justify-center text-text-primary font-bold text-lg">
                        {participant.user.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-text-primary truncate">
                        {participant.user.name || 'Anonymous'}
                      </h3>
                      {index === 0 && (
                        <span className="bg-gold/15 border border-gold/30 text-gold px-2 py-0.5 rounded text-xs font-medium">
                          First
                        </span>
                      )}
                      {participant.user.id === user?.id && (
                        <span className="bg-emerald/15 border border-emerald/30 text-emerald px-2 py-0.5 rounded text-xs font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-text-muted text-sm truncate">
                      Joined {new Date(participant.registered_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-emerald/10 p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">Share Activity</h3>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full bg-green-600 hover:bg-green-700 text-text-primary py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <span>💬</span>
                <span>Share on WhatsApp</span>
              </button>

              <button
                onClick={() => handleShare('copy')}
                className="w-full bg-dark-hover hover:bg-dark-border text-text-primary py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                <span>🔗</span>
                <span>{copySuccess ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-gradient-emerald shadow-button text-text-primary py-2 rounded-lg font-medium hover:-translate-y-1 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Invite Code Modal */}
      {showInviteCodeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-emerald/10 p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold text-text-primary mb-4">🔒 Enter Invite Code</h3>

            <p className="text-text-muted mb-4">
              This is an invite-only activity. Please enter the invite code you received from the organizer.
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
                {isJoining ? 'Joining...' : 'Join Activity'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!user && (
        <div className="bg-gradient-emerald/10 border border-emerald/30 rounded-2xl p-6">
          <h3 className="font-display text-lg font-bold text-text-primary mb-2">
            Need to sign in
          </h3>
          <p className="text-text-secondary text-sm">
            Create an account or sign in to join this activity, see participant details, and get updates from the organizers.
          </p>
        </div>
      )}
    </div>
  )
}

export default ActivityDetail