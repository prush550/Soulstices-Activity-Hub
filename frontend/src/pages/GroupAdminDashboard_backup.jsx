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
    participant_limit: ''
  })
  const [createActivityLoading, setCreateActivityLoading] = useState(false)
  const [createActivityMessage, setCreateActivityMessage] = useState(null)

  // My Activities state
  const [myActivities, setMyActivities] = useState([])
  const [editingActivity, setEditingActivity] = useState(null)

  useEffect(() => {
    if (userProfile) {
      fetchMyGroups()
      fetchMyActivities()
    }
  }, [userProfile])

  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      // Fetch groups where user is an admin
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

      // Set first group as selected by default
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

  const handleCreateActivity = async (e) => {
    e.preventDefault()
    setCreateActivityLoading(true)
    setCreateActivityMessage(null)

    try {
      const activityData = {
        ...activityForm,
        created_by: userProfile.id,
        participant_limit: activityForm.participant_limit ? parseInt(activityForm.participant_limit) : null,
        current_participants: 0
      }

      const { data, error } = await supabase
        .from('activities')
        .insert([activityData])
        .select()
        .single()

      if (error) throw error

      setCreateActivityMessage({ type: 'success', text: 'Activity created successfully!' })

      // Reset form
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
        participant_limit: ''
      })

      // Refresh activities
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

      // Refresh activities
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
      participant_limit: activity.participant_limit || ''
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

      // Reset form
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
        participant_limit: ''
      })

      // Refresh activities
      fetchMyActivities()
      setActiveTab('my-activities')
    } catch (error) {
      console.error('Error updating activity:', error)
      setCreateActivityMessage({ type: 'error', text: error.message })
    } finally {
      setCreateActivityLoading(false)
    }
  }

  const tabs = [
    { id: 'my-groups', label: 'My Groups', icon: '🏢' },
    { id: 'create-activity', label: 'Create Activity', icon: '➕' },
    { id: 'my-activities', label: 'My Activities', icon: '📅' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (myGroups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            No Groups Assigned
          </h2>
          <p className="text-gray-400 mb-6">
            You haven't been assigned as an admin for any groups yet. Contact the platform founder to get assigned.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-accent-primary hover:bg-accent-secondary text-white px-6 py-3 rounded-md font-medium"
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
        <h1 className="font-display text-4xl font-bold text-white mb-2">
          Group Admin Dashboard
        </h1>
        <p className="text-gray-400">
          Manage your groups and create activities
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-dark-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'create-activity' && editingActivity) {
                // Cancel editing when switching to create tab
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
                  participant_limit: ''
                })
              }
            }}
            className={`px-6 py-3 font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'text-accent-primary border-b-2 border-accent-primary'
                : 'text-gray-400 hover:text-white'
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
            <h2 className="font-display text-2xl font-bold text-white mb-6">Groups You Manage</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myGroups.map((group) => (
                <div key={group.id} className="bg-dark-card border border-dark-border rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-white mb-1">
                        {group.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">{group.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-accent-primary/20 text-accent-primary text-xs px-3 py-1 rounded-full">
                          {group.category}
                        </span>
                        <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full">
                          {group.joining_type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dark-border pt-4 mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">👥 {group.member_count || 0} members</span>
                    <button
                      onClick={() => {
                        setSelectedGroup(group.id)
                        setActivityForm(prev => ({ ...prev, group_id: group.id }))
                        setActiveTab('create-activity')
                      }}
                      className="bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create Activity
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Activity Tab */}
        {activeTab === 'create-activity' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-white mb-6">
              {editingActivity ? 'Edit Activity' : 'Create New Activity'}
            </h2>

            <form onSubmit={editingActivity ? handleUpdateActivity : handleCreateActivity} className="bg-dark-card border border-dark-border rounded-lg p-6 space-y-6">
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
                </select>
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
                  className="flex-1 bg-accent-primary hover:bg-accent-secondary text-white font-medium py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
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
                        participant_limit: ''
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
            <h2 className="font-display text-2xl font-bold text-white mb-6">Activities You Created</h2>

            {myActivities.length === 0 ? (
              <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-400 mb-4">No activities created yet</p>
                <button
                  onClick={() => setActiveTab('create-activity')}
                  className="bg-accent-primary hover:bg-accent-secondary text-white px-6 py-2 rounded-md font-medium"
                >
                  Create Your First Activity
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myActivities.map((activity) => (
                  <div key={activity.id} className="bg-dark-card border border-dark-border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{activity.title}</h3>
                        <p className="text-sm text-gray-400 mb-2">{activity.group?.name}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="text-gray-300 text-sm">📍 {activity.place}</span>
                          <span className="text-gray-300 text-sm">📅 {new Date(activity.date).toLocaleDateString()}</span>
                          <span className="text-gray-300 text-sm">🕐 {activity.start_time} - {activity.end_time}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-3 py-1 rounded-full ${
                            activity.type === 'public'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {activity.type}
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full bg-accent-primary/20 text-accent-primary">
                            💰 {activity.payment}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditActivity(activity)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {activity.description && (
                      <p className="text-gray-400 text-sm border-t border-dark-border pt-4">
                        {activity.description}
                      </p>
                    )}

                    <div className="border-t border-dark-border pt-4 mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        👥 {activity.current_participants || 0} joined
                        {activity.participant_limit && ` / ${activity.participant_limit} max`}
                      </span>
                      <button
                        onClick={() => navigate(`/activity/${activity.id}`)}
                        className="text-accent-primary hover:text-accent-secondary font-medium"
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
