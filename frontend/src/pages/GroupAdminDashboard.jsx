import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

function GroupAdminDashboard() {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('my-groups')
  const [loading, setLoading] = useState(true)

  // My Groups state
  const [myGroups, setMyGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)

  // Edit Group state
  const [editingGroup, setEditingGroup] = useState(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: '',
    joining_type: 'public'
  })
  const [editGroupLoading, setEditGroupLoading] = useState(false)
  const [editGroupMessage, setEditGroupMessage] = useState(null)
  const [generatedInviteCode, setGeneratedInviteCode] = useState(null)

  // Create Activity state
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    group_id: '',
    place: '',
    date: '',
    start_time: '',
    end_time: '',
    payment: '',
    type: 'public',
    participant_limit: '',
    invite_code: ''
  })
  const [createActivityLoading, setCreateActivityLoading] = useState(false)
  const [createActivityMessage, setCreateActivityMessage] = useState(null)

  // My Activities state
  const [myActivities, setMyActivities] = useState([])
  const [editingActivity, setEditingActivity] = useState(null)

  // Join Requests state
  const [joinRequests, setJoinRequests] = useState([])
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState(null)

  useEffect(() => {
    if (userProfile) {
      fetchMyGroups()
      fetchMyActivities()
      fetchJoinRequests()
    }
  }, [userProfile])

  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('group_admins')
        .select(`
          group:groups (
            id,
            name,
            description,
            category,
            joining_type,
            member_count,
            created_at
          )
        `)
        .eq('user_id', userProfile.id)

      if (error) throw error

      const groups = data.map(item => item.group).filter(Boolean)
      setMyGroups(groups)

      if (groups.length > 0 && !selectedGroup) {
        setSelectedGroup(groups[0].id)
        setActivityForm(prev => ({ ...prev, group_id: groups[0].id }))
      }
    } catch (error) {
      console.error('Error fetching my groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          group:groups (
            id,
            name
          )
        `)
        .eq('created_by', userProfile.id)
        .order('date', { ascending: false })

      if (error) throw error
      setMyActivities(data || [])
    } catch (error) {
      console.error('Error fetching my activities:', error)
    }
  }

  const fetchJoinRequests = async () => {
    try {
      setJoinRequestsLoading(true)

      // Get all groups where user is admin
      const { data: adminGroups, error: adminError } = await supabase
        .from('group_admins')
        .select('group_id')
        .eq('user_id', userProfile.id)

      if (adminError) throw adminError

      const groupIds = adminGroups.map(g => g.group_id)

      if (groupIds.length === 0) {
        setJoinRequests([])
        setJoinRequestsLoading(false)
        return
      }

      // Fetch pending join requests for these groups
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          group_id,
          status,
          application_data,
          joined_at,
          user:users (
            id,
            name,
            email,
            profile_picture
          ),
          group:groups (
            id,
            name,
            joining_type
          )
        `)
        .in('group_id', groupIds)
        .eq('status', 'pending')
        .order('joined_at', { ascending: false })

      if (error) throw error

      setJoinRequests(data || [])
    } catch (error) {
      console.error('Error fetching join requests:', error)
      setJoinRequests([])
    } finally {
      setJoinRequestsLoading(false)
    }
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description,
      category: group.category,
      joining_type: group.joining_type
    })
    setActiveTab('edit-group')
  }

  const handleUpdateGroup = async (e) => {
    e.preventDefault()
    setEditGroupLoading(true)
    setEditGroupMessage(null)
    setGeneratedInviteCode(null)

    try {
      // Check if joining_type is being changed to invite_only and needs invite code
      let inviteCode = editingGroup.invite_code
      if (groupForm.joining_type === 'invite_only' && !inviteCode) {
        inviteCode = generateInviteCode()
        setGeneratedInviteCode(inviteCode)
      }

      const updateData = { ...groupForm }
      if (inviteCode) {
        updateData.invite_code = inviteCode
      }

      const { error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', editingGroup.id)

      if (error) throw error

      let successMessage = 'Group updated successfully!'
      if (inviteCode && groupForm.joining_type === 'invite_only' && !editingGroup.invite_code) {
        successMessage += ` New invite code generated: ${inviteCode}`
      }

      setEditGroupMessage({ type: 'success', text: successMessage })
      fetchMyGroups()

      // Don't auto-close if we generated a new invite code - give admin time to copy it
      if (inviteCode && !editingGroup.invite_code) {
        // Stay on edit page to show the invite code
      } else {
        setTimeout(() => {
          setEditingGroup(null)
          setActiveTab('my-groups')
        }, 1500)
      }
    } catch (error) {
      console.error('Error updating group:', error)
      setEditGroupMessage({ type: 'error', text: error.message })
    } finally {
      setEditGroupLoading(false)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleCreateActivity = async (e) => {
    e.preventDefault()
    setCreateActivityLoading(true)
    setCreateActivityMessage(null)

    try {
      const activityData = {
        ...activityForm,
        created_by: userProfile.id,
        participant_limit: activityForm.participant_limit ? parseInt(activityForm.participant_limit) : null,
        current_participants: 0,
        // Generate invite code for invite-only activities
        invite_code: activityForm.type === 'invite_only' ? generateInviteCode() : null
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single()

      if (error) throw error

      let successMessage = 'Activity created successfully!'
      if (activityData.invite_code) {
        successMessage += ` Invite code: ${activityData.invite_code}`
      }

      setCreateActivityMessage({ type: 'success', text: successMessage })

      setActivityForm({
        title: '',
        description: '',
        group_id: selectedGroup || '',
        place: '',
        date: '',
        start_time: '',
        end_time: '',
        payment: '',
        type: 'public',
        participant_limit: '',
        invite_code: ''
      })

      fetchMyActivities()
    } catch (error) {
      console.error('Error creating activity:', error)
      setCreateActivityMessage({ type: 'error', text: error.message })
    } finally {
      setCreateActivityLoading(false)
    }
  }

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId)

      if (error) throw error

      fetchMyActivities()
      alert('Activity deleted successfully!')
    } catch (error) {
      console.error('Error deleting activity:', error)
      alert('Failed to delete activity: ' + error.message)
    }
  }

  const handleEditActivity = (activity) => {
    setEditingActivity(activity)
    setActivityForm({
      title: activity.title,
      description: activity.description,
      group_id: activity.group_id,
      place: activity.place,
      date: activity.date,
      start_time: activity.start_time,
      end_time: activity.end_time,
      payment: activity.payment,
      type: activity.type,
      participant_limit: activity.participant_limit || '',
      invite_code: activity.invite_code || ''
    })
    setActiveTab('create-activity')
  }

  const handleUpdateActivity = async (e) => {
    e.preventDefault()
    setCreateActivityLoading(true)
    setCreateActivityMessage(null)

    try {
      const activityData = {
        ...activityForm,
        participant_limit: activityForm.participant_limit ? parseInt(activityForm.participant_limit) : null
      }

      const { error } = await supabase
        .from('activities')
        .update(activityData)
        .eq('id', editingActivity.id)

      if (error) throw error

      setCreateActivityMessage({ type: 'success', text: 'Activity updated successfully!' })
      setEditingActivity(null)

      setActivityForm({
        title: '',
        description: '',
        group_id: selectedGroup || '',
        place: '',
        date: '',
        start_time: '',
        end_time: '',
        payment: '',
        type: 'public',
        participant_limit: '',
        invite_code: ''
      })

      fetchMyActivities()
      setActiveTab('my-activities')
    } catch (error) {
      console.error('Error updating activity:', error)
      setCreateActivityMessage({ type: 'error', text: error.message })
    } finally {
      setCreateActivityLoading(false)
    }
  }

  const handleApproveRequest = async (requestId) => {
    if (!confirm('Approve this join request?')) return

    setProcessingRequest(requestId)

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'approved' })
        .eq('id', requestId)

      if (error) throw error

      alert('Request approved! User is now a member of the group.')
      fetchJoinRequests()
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Failed to approve request: ' + error.message)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId) => {
    if (!confirm('Reject this join request? The user will need to reapply.')) return

    setProcessingRequest(requestId)

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'rejected' })
        .eq('id', requestId)

      if (error) throw error

      alert('Request rejected.')
      fetchJoinRequests()
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Failed to reject request: ' + error.message)
    } finally {
      setProcessingRequest(null)
    }
  }

  const tabs = [
    { id: 'my-groups', label: 'My Groups', icon: '🏢' },
    { id: 'join-requests', label: `Join Requests ${joinRequests.length > 0 ? `(${joinRequests.length})` : ''}`, icon: '📋' },
    { id: 'create-activity', label: editingActivity ? 'Edit Activity' : 'Create Activity', icon: '➕' },
    { id: 'my-activities', label: 'My Activities', icon: '📅' }
  ]

  if (editingGroup) {
    tabs.push({ id: 'edit-group', label: 'Edit Group', icon: '✏️' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (myGroups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="glass rounded-2xl border border-emerald/10 p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="font-display text-2xl font-bold text-text-primary mb-4">
            No Groups Assigned
          </h2>
          <p className="text-text-muted mb-6">
            You haven't been assigned as an admin for any groups yet. Contact the platform founder to get assigned.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-emerald shadow-button text-text-primary px-6 py-3 rounded-xl font-medium hover:-translate-y-1 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          Group Admin Dashboard
        </h1>
        <p className="text-text-muted">
          Manage your groups and create activities
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-emerald/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'create-activity' && editingActivity) {
                setEditingActivity(null)
                setActivityForm({
                  title: '',
                  description: '',
                  group_id: selectedGroup || '',
                  place: '',
                  date: '',
                  start_time: '',
                  end_time: '',
                  payment: '',
                  type: 'public',
                  participant_limit: '',
                  invite_code: ''
                })
              }
              if (tab.id === 'my-groups' && editingGroup) {
                setEditingGroup(null)
              }
            }}
            className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-emerald border-b-2 border-emerald'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* My Groups Tab */}
        {activeTab === 'my-groups' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Groups You Manage</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myGroups.map((group) => (
                <div key={group.id} className="glass rounded-2xl border border-emerald/10 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                        {group.name}
                      </h3>
                      <p className="text-sm text-text-muted mb-3">{group.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-emerald/15 border border-emerald/30 text-emerald text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide">
                          {group.category}
                        </span>
                        <span className="bg-gold/15 border border-gold/30 text-gold text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide">
                          {group.joining_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-emerald/10 pt-4 mt-4 flex items-center justify-between text-sm">
                    <span className="text-text-muted">👥 {group.member_count || 0} members</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="bg-blue-600 hover:bg-blue-700 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group.id)
                          setActivityForm(prev => ({ ...prev, group_id: group.id }))
                          setActiveTab('create-activity')
                        }}
                        className="bg-gradient-gold shadow-button-gold text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:-translate-y-1 transition-all"
                      >
                        ➕ Create Activity
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'join-requests' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
              Join Requests for Your Groups
            </h2>

            {joinRequestsLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-muted">Loading join requests...</p>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="glass rounded-2xl border border-emerald/10 p-12 text-center">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="font-display text-xl font-bold text-text-primary mb-2">
                  No Pending Requests
                </h3>
                <p className="text-text-muted">
                  All join requests have been processed. New applications will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="glass rounded-2xl border border-emerald/10 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* User Avatar */}
                        <div className="w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center text-text-primary font-bold text-lg flex-shrink-0">
                          {request.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-text-primary text-lg">
                              {request.user?.name || 'Unknown User'}
                            </h3>
                            <span className="text-sm text-text-muted">
                              • {request.user?.email}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                            <span>Applied to:</span>
                            <span className="text-emerald font-medium">
                              {request.group?.name}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(request.joined_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Application Data */}
                          {request.application_data && (
                            <div className="bg-dark-bg border border-emerald/20 rounded-xl p-4 space-y-3">
                              <h4 className="font-semibold text-text-primary text-sm mb-2">
                                📝 Application Details
                              </h4>

                              {request.application_data.reason && (
                                <div>
                                  <p className="text-xs text-text-muted mb-1">
                                    Why they want to join:
                                  </p>
                                  <p className="text-sm text-text-secondary">
                                    {request.application_data.reason}
                                  </p>
                                </div>
                              )}

                              {request.application_data.experience && (
                                <div>
                                  <p className="text-xs text-text-muted mb-1">
                                    Their experience:
                                  </p>
                                  <p className="text-sm text-text-secondary">
                                    {request.application_data.experience}
                                  </p>
                                </div>
                              )}

                              {/* Other custom fields */}
                              {Object.entries(request.application_data)
                                .filter(([key]) => key !== 'reason' && key !== 'experience')
                                .map(([key, value]) => (
                                  <div key={key}>
                                    <p className="text-xs text-text-muted mb-1 capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </p>
                                    <p className="text-sm text-text-secondary">{value}</p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-emerald/10">
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          processingRequest === request.id
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-emerald shadow-button text-text-primary hover:-translate-y-1'
                        }`}
                      >
                        {processingRequest === request.id ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingRequest === request.id}
                        className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                          processingRequest === request.id
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-text-primary'
                        }`}
                      >
                        {processingRequest === request.id ? 'Processing...' : '✗ Reject'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Group Tab */}
        {activeTab === 'edit-group' && editingGroup && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Edit Group: {editingGroup.name}</h2>

            <form onSubmit={handleUpdateGroup} className="bg-dark-card border border-dark-border rounded-lg p-6 space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  rows="4"
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.category}
                  onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
              </div>

              {/* Joining Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Joining Type *
                </label>
                <select
                  required
                  value={groupForm.joining_type}
                  onChange={(e) => setGroupForm({ ...groupForm, joining_type: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="invite_only">Invite Only - Requires invite link</option>
                  <option value="screening">Screening - Application + Approval</option>
                </select>
              </div>

              {/* Message */}
              {editGroupMessage && (
                <div className={`p-4 rounded-md ${
                  editGroupMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {editGroupMessage.text}
                </div>
              )}

              {/* Generated Invite Code Display */}
              {generatedInviteCode && (
                <div className="p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-blue-400 font-bold text-lg">🎫 Invite Code Generated!</span>
                  </div>
                  <div className="bg-dark-bg rounded-md p-4 mb-3">
                    <code className="text-2xl font-mono font-bold text-blue-300 tracking-wider">
                      {generatedInviteCode}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteCode)
                      alert('Invite code copied to clipboard!')
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium mb-2 w-full"
                  >
                    📋 Copy Invite Code
                  </button>
                  <p className="text-sm text-blue-300">
                    ⚠️ <strong>Save this code!</strong> Share it with members who need to join this invite-only group.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={editGroupLoading}
                  className="flex-1 bg-accent-primary hover:bg-accent-secondary text-white font-medium py-3 rounded-md disabled:opacity-50"
                >
                  {editGroupLoading ? 'Updating...' : 'Update Group'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroup(null)
                    setActiveTab('my-groups')
                  }}
                  className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create/Edit Activity Tab */}
        {activeTab === 'create-activity' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">
              {editingActivity ? 'Edit Activity' : 'Create New Activity'}
            </h2>

            <form onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity} className="glass rounded-2xl border border-emerald/10 p-6 space-y-6">
              {/* Select Group */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Group *
                </label>
                <select
                  required
                  value={activityForm.group_id}
                  onChange={(e) => setActivityForm({ ...activityForm, group_id: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  disabled={editingActivity}
                >
                  <option value="">Choose a group...</option>
                  {myGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="e.g., Evening Badminton Session"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  rows="4"
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Describe the activity..."
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={activityForm.place}
                  onChange={(e) => setActivityForm({ ...activityForm, place: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="e.g., DB City Sports Complex"
                />
              </div>

              {/* Date and Times */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={activityForm.date}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={activityForm.start_time}
                    onChange={(e) => setActivityForm({ ...activityForm, start_time: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={activityForm.end_time}
                    onChange={(e) => setActivityForm({ ...activityForm, end_time: e.target.value })}
                    className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  />
                </div>
              </div>

              {/* Payment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment/Cost *
                </label>
                <input
                  type="text"
                  required
                  value={activityForm.payment}
                  onChange={(e) => setActivityForm({ ...activityForm, payment: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="e.g., ₹100 per person or Free"
                />
              </div>

              {/* Activity Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Activity Type *
                </label>
                <select
                  required
                  value={activityForm.type}
                  onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="private">Private - Only group members can join</option>
                  <option value="invite_only">Invite-Only - Requires invite code</option>
                </select>
                {activityForm.type === 'invite_only' && !editingActivity && (
                  <p className="text-sm text-blue-400 mt-2">
                    💡 An invite code will be automatically generated when you create this activity
                  </p>
                )}
                {activityForm.type === 'invite_only' && editingActivity && activityForm.invite_code && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                    <p className="text-sm text-blue-400">
                      🔑 Invite Code: <span className="font-bold">{activityForm.invite_code}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Participant Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Participant Limit (optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={activityForm.participant_limit}
                  onChange={(e) => setActivityForm({ ...activityForm, participant_limit: e.target.value })}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                  placeholder="Leave empty for unlimited"
                />
              </div>

              {/* Message */}
              {createActivityMessage && (
                <div className={`p-4 rounded-md ${
                  createActivityMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {createActivityMessage.text}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createActivityLoading}
                  className="flex-1 bg-gradient-gold shadow-button-gold text-text-primary font-medium py-3 rounded-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createActivityLoading
                    ? (editingActivity ? 'Updating...' : 'Creating...')
                    : (editingActivity ? 'Update Activity' : 'Create Activity')
                  }
                </button>
                {editingActivity && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingActivity(null)
                      setActivityForm({
                        title: '',
                        description: '',
                        group_id: selectedGroup || '',
                        place: '',
                        date: '',
                        start_time: '',
                        end_time: '',
                        payment: '',
                        type: 'public',
                        participant_limit: '',
                        invite_code: ''
                      })
                      setCreateActivityMessage(null)
                    }}
                    className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-md"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* My Activities Tab */}
        {activeTab === 'my-activities' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Activities You Created</h2>

            {myActivities.length === 0 ? (
              <div className="glass rounded-2xl border border-emerald/10 p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-text-muted mb-4">No activities created yet</p>
                <button
                  onClick={() => setActiveTab('create-activity')}
                  className="bg-gradient-gold shadow-button-gold text-text-primary px-6 py-2 rounded-xl font-medium hover:-translate-y-1 transition-all"
                >
                  Create Your First Activity
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myActivities.map((activity) => (
                  <div key={activity.id} className="glass rounded-2xl border border-emerald/10 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-1">{activity.title}</h3>
                        <p className="text-sm text-text-muted mb-2">{activity.group?.name}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-text-secondary text-sm">📍 {activity.place}</span>
                          <span className="text-text-secondary text-sm">📅 {new Date(activity.date).toLocaleDateString()}</span>
                          <span className="text-text-secondary text-sm">🕐 {activity.start_time} - {activity.end_time}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-[11px] uppercase px-3 py-1 rounded-full font-medium tracking-wide ${
                            activity.type === 'public'
                              ? 'bg-emerald/15 border border-emerald/30 text-emerald'
                              : activity.type === 'private'
                              ? 'bg-emerald/15 border border-emerald/30 text-emerald'
                              : 'bg-gold/15 border border-gold/30 text-gold'
                          }`}>
                            {activity.type === 'invite_only' ? 'Invite-Only' : activity.type}
                          </span>
                          <span className="text-[11px] uppercase px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold font-medium tracking-wide">
                            💰 {activity.payment}
                          </span>
                          {activity.invite_code && (
                            <span className="text-xs px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold">
                              🔑 Code: {activity.invite_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className="bg-blue-600 hover:bg-blue-700 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="bg-red-600 hover:bg-red-700 text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-text-muted text-sm border-t border-emerald/10 pt-4">
                        {activity.description}
                      </p>
                    )}

                    <div className="border-t border-emerald/10 pt-4 mt-4 flex items-center justify-between text-sm">
                      <span className="text-text-muted">
                        👥 {activity.current_participants || 0} joined
                        {activity.participant_limit && ` / ${activity.participant_limit} max`}
                      </span>
                      <button
                        onClick={() => navigate(`/activity/${activity.id}`)}
                        className="text-emerald hover:text-gold font-medium transition-colors"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default GroupAdminDashboard
