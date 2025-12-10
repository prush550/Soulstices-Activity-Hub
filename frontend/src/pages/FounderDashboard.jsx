import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function FounderDashboard() {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalGroups: 0,
    totalActivities: 0,
    totalUsers: 0,
    totalMembers: 0
  })

  // Group creation form state
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    category: '',
    joining_type: 'public',
    cover_image: ''
  })
  const [createGroupLoading, setCreateGroupLoading] = useState(false)
  const [createGroupMessage, setCreateGroupMessage] = useState(null)
  const [generatedInviteCode, setGeneratedInviteCode] = useState(null)

  // Admin assignment state
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedUser, setSelectedUser] = useState('')
  const [assignAdminLoading, setAssignAdminLoading] = useState(false)
  const [assignAdminMessage, setAssignAdminMessage] = useState(null)

  // All groups for management
  const [allGroups, setAllGroups] = useState([])

  useEffect(() => {
    fetchAnalytics()
    fetchGroups()
    fetchUsers()
    fetchAllGroups()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [groupsRes, activitiesRes, usersRes, membersRes] = await Promise.all([
        supabase.from('groups').select('id', { count: 'exact', head: true }),
        supabase.from('activities').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'member')
      ])

      setAnalytics({
        totalGroups: groupsRes.count || 0,
        totalActivities: activitiesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalMembers: membersRes.count || 0
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_admins (
            user:users (
              id,
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAllGroups(data || [])
    } catch (error) {
      console.error('Error fetching all groups:', error)
    }
  }

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setCreateGroupLoading(true)
    setCreateGroupMessage(null)
    setGeneratedInviteCode(null)

    try {
      // Generate invite code if joining type is invite_only
      const inviteCode = groupForm.joining_type === 'invite_only' ? generateInviteCode() : null

      const { data, error } = await supabase
        .from('groups')
        .insert([
          {
            ...groupForm,
            created_by: userProfile.id,
            invite_code: inviteCode
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Show success message with invite code if applicable
      if (inviteCode) {
        setGeneratedInviteCode(inviteCode)
        setCreateGroupMessage({
          type: 'success',
          text: `Group created successfully! Invite code: ${inviteCode}`
        })
      } else {
        setCreateGroupMessage({ type: 'success', text: 'Group created successfully!' })
      }

      setGroupForm({
        name: '',
        description: '',
        category: '',
        joining_type: 'public',
        cover_image: ''
      })

      // Refresh data
      fetchAnalytics()
      fetchGroups()
      fetchAllGroups()
    } catch (error) {
      console.error('Error creating group:', error)
      setCreateGroupMessage({ type: 'error', text: error.message })
    } finally {
      setCreateGroupLoading(false)
    }
  }

  const handleAssignAdmin = async (e) => {
    e.preventDefault()
    setAssignAdminLoading(true)
    setAssignAdminMessage(null)

    if (!selectedGroup || !selectedUser) {
      setAssignAdminMessage({ type: 'error', text: 'Please select both group and user' })
      setAssignAdminLoading(false)
      return
    }

    try {
      // Check if already an admin
      const { data: existing } = await supabase
        .from('group_admins')
        .select('id')
        .eq('group_id', selectedGroup)
        .eq('user_id', selectedUser)
        .single()

      if (existing) {
        setAssignAdminMessage({ type: 'error', text: 'User is already an admin of this group' })
        setAssignAdminLoading(false)
        return
      }

      // Assign admin
      const { error: insertError } = await supabase
        .from('group_admins')
        .insert([
          {
            group_id: selectedGroup,
            user_id: selectedUser
          }
        ])

      if (insertError) throw insertError

      // Update user role to group_admin ONLY if they're not already founder
      // Founders should keep their founder role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', selectedUser)
        .single()

      if (userData && userData.role !== 'founder') {
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'group_admin' })
          .eq('id', selectedUser)

        if (updateError) throw updateError
      }

      setAssignAdminMessage({ type: 'success', text: 'Admin assigned successfully!' })
      setSelectedGroup('')
      setSelectedUser('')

      // Refresh data
      fetchUsers()
      fetchAllGroups()
    } catch (error) {
      console.error('Error assigning admin:', error)
      setAssignAdminMessage({ type: 'error', text: error.message })
    } finally {
      setAssignAdminLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'create-group', label: 'Create Group', icon: '➕' },
    { id: 'assign-admin', label: 'Assign Admin', icon: '👤' },
    { id: 'manage-groups', label: 'Manage Groups', icon: '⚙️' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          Founder Dashboard
        </h1>
        <p className="text-text-muted">
          Welcome back, {userProfile?.name}! Manage your platform from here.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b border-emerald/10 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-text-primary">Platform Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass rounded-2xl border border-emerald/10 p-6 fade-in-up">
                <div className="text-4xl mb-2">🏢</div>
                <div className="text-3xl font-bold text-emerald mb-1">
                  {analytics.totalGroups}
                </div>
                <div className="text-text-muted text-sm">Total Groups</div>
              </div>

              <div className="glass rounded-2xl border border-emerald/10 p-6 fade-in-up">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-3xl font-bold text-emerald mb-1">
                  {analytics.totalActivities}
                </div>
                <div className="text-text-muted text-sm">Total Activities</div>
              </div>

              <div className="glass rounded-2xl border border-emerald/10 p-6 fade-in-up">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-3xl font-bold text-emerald mb-1">
                  {analytics.totalUsers}
                </div>
                <div className="text-text-muted text-sm">Total Users</div>
              </div>

              <div className="glass rounded-2xl border border-emerald/10 p-6 fade-in-up">
                <div className="text-4xl mb-2">✅</div>
                <div className="text-3xl font-bold text-emerald mb-1">
                  {analytics.totalMembers}
                </div>
                <div className="text-text-muted text-sm">Active Members</div>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Tab */}
        {activeTab === 'create-group' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Create New Group</h2>

            <form onSubmit={handleCreateGroup} className="glass rounded-2xl border border-emerald/10 p-6 space-y-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full bg-dark-card border border-emerald/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-emerald transition-colors"
                  placeholder="e.g., Bhopal Badminton Club"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description *
                </label>
                <textarea
                  required
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  rows="4"
                  className="w-full bg-dark-card border border-emerald/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-emerald transition-colors"
                  placeholder="Describe what this group is about..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  required
                  value={groupForm.category}
                  onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                  className="w-full bg-dark-card border border-emerald/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-emerald transition-colors"
                  placeholder="e.g., Sports, Fitness, Leisure"
                />
              </div>

              {/* Joining Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Joining Type *
                </label>
                <select
                  required
                  value={groupForm.joining_type}
                  onChange={(e) => setGroupForm({ ...groupForm, joining_type: e.target.value })}
                  className="w-full bg-dark-card border border-emerald/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-emerald transition-colors"
                >
                  <option value="public">Public - Anyone can join</option>
                  <option value="invite_only">Invite Only - Requires invite link</option>
                  <option value="screening">Screening - Application + Approval</option>
                </select>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Cover Image URL (optional)
                </label>
                <input
                  type="url"
                  value={groupForm.cover_image}
                  onChange={(e) => setGroupForm({ ...groupForm, cover_image: e.target.value })}
                  className="w-full bg-dark-card border border-emerald/20 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-emerald transition-colors"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {/* Message */}
              {createGroupMessage && (
                <div className={`p-4 rounded-md ${
                  createGroupMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {createGroupMessage.text}

                  {/* Invite Code Display */}
                  {generatedInviteCode && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <p className="text-blue-300 text-sm font-semibold mb-2">📋 Share this invite code with members:</p>
                      <div className="flex items-center space-x-3">
                        <code className="flex-1 bg-dark-bg px-4 py-3 rounded-md text-2xl font-mono tracking-wider text-white text-center">
                          {generatedInviteCode}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedInviteCode)
                            alert('Invite code copied to clipboard!')
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-md font-medium"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-blue-400 text-xs mt-2">
                        ⚠️ Save this code! You'll need it to invite members to this group.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createGroupLoading}
                className="w-full bg-gradient-gold shadow-button-gold text-text-primary font-medium py-3 rounded-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createGroupLoading ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        {/* Assign Admin Tab */}
        {activeTab === 'assign-admin' && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Assign Group Admin</h2>

            <form onSubmit={handleAssignAdmin} className="glass rounded-2xl border border-emerald/10 p-6 space-y-6">
              {/* Select Group */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Group *
                </label>
                <select
                  required
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="">Choose a group...</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select User */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select User *
                </label>
                <select
                  required
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                  <option value="">Choose a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              {assignAdminMessage && (
                <div className={`p-4 rounded-md ${
                  assignAdminMessage.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {assignAdminMessage.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={assignAdminLoading}
                className="w-full bg-gradient-emerald shadow-button text-text-primary font-medium py-3 rounded-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignAdminLoading ? 'Assigning...' : 'Assign as Admin'}
              </button>
            </form>
          </div>
        )}

        {/* Manage Groups Tab */}
        {activeTab === 'manage-groups' && (
          <div>
            <h2 className="font-display text-2xl font-bold text-text-primary mb-6">All Groups</h2>

            <div className="space-y-4">
              {allGroups.length === 0 ? (
                <div className="glass rounded-2xl border border-emerald/10 p-12 text-center">
                  <div className="text-6xl mb-4">🏢</div>
                  <p className="text-text-muted mb-4">No groups created yet</p>
                  <button
                    onClick={() => setActiveTab('create-group')}
                    className="bg-gradient-gold shadow-button-gold text-text-primary px-6 py-2 rounded-xl font-medium hover:-translate-y-1 transition-all"
                  >
                    Create First Group
                  </button>
                </div>
              ) : (
                allGroups.map((group) => (
                  <div key={group.id} className="glass rounded-2xl border border-emerald/10 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-display text-xl font-bold text-text-primary mb-1">
                          {group.name}
                        </h3>
                        <p className="text-sm text-text-muted mb-2">{group.description}</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="bg-emerald/15 border border-emerald/30 text-emerald px-3 py-1 rounded-full text-[11px] uppercase font-medium tracking-wide">
                            {group.category}
                          </span>
                          <span className="bg-gold/15 border border-gold/30 text-gold px-3 py-1 rounded-full text-[11px] uppercase font-medium tracking-wide">
                            {group.joining_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admins */}
                    <div className="border-t border-emerald/10 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-text-secondary mb-2">Admins:</h4>
                      {group.group_admins && group.group_admins.length > 0 ? (
                        <div className="space-y-1">
                          {group.group_admins.map((admin) => (
                            <div key={admin.user.id} className="text-sm text-text-muted">
                              👤 {admin.user.name} ({admin.user.email})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted italic">No admins assigned yet</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="border-t border-emerald/10 pt-4 mt-4 flex items-center space-x-6 text-sm text-text-muted">
                      <span>👥 {group.member_count || 0} members</span>
                      <span>📅 Created {new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FounderDashboard
