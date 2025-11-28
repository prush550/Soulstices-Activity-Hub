import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Groups() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setGroups(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching groups:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
          Discover Groups
        </h1>
        <p className="text-xl text-gray-400">
          Join communities of sports and leisure enthusiasts in Bhopal
        </p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div
            key={group.id}
            onClick={() => navigate(`/group/${group.id}`)}
            className="bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/20 cursor-pointer group"
          >
            {/* Group Cover */}
            <div className="h-48 bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 flex items-center justify-center">
              <span className="text-6xl">
                {group.category.includes('Badminton') && '🏸'}
                {group.category.includes('Fitness') && '💪'}
                {group.category.includes('Football') && '⚽'}
                {group.category.includes('Yoga') && '🧘'}
                {group.category.includes('Cycling') && '🚴'}
                {group.category.includes('Multi-Sport') && '🏆'}
              </span>
            </div>

            {/* Group Details */}
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-accent-primary">
                  {group.name}
                </h3>
                <span className="inline-block bg-accent-primary/20 text-accent-primary text-sm px-3 py-1 rounded-full">
                  {group.category}
                </span>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {group.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-400">
                  👥 {group.member_count || 0} members
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  group.joining_type === 'public'
                    ? 'bg-green-500/20 text-green-400'
                    : group.joining_type === 'invite_only'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {group.joining_type === 'public' && '🌍 Public'}
                  {group.joining_type === 'invite_only' && '🎫 Invite-Only'}
                  {group.joining_type === 'screening' && '📋 Screening'}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/group/${group.id}`)
                }}
                className="w-full bg-accent-primary hover:bg-accent-secondary text-white py-2 rounded-md font-medium"
              >
                View Group
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-display font-bold text-white mb-2">
            No groups yet
          </h3>
          <p className="text-gray-400">
            Be the first to create a group and build your community!
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 bg-dark-card border border-dark-border rounded-lg p-8">
        <h2 className="font-display text-2xl font-bold text-white mb-4">
          How Groups Work
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-300">
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center">
              <span className="text-accent-primary mr-2">✓</span>
              Join Communities
            </h3>
            <p className="text-sm">
              Connect with like-minded people who share your interests in sports and leisure activities.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center">
              <span className="text-accent-primary mr-2">✓</span>
              Exclusive Activities
            </h3>
            <p className="text-sm">
              Access private activities and events organized exclusively for group members.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center">
              <span className="text-accent-primary mr-2">✓</span>
              Stay Updated
            </h3>
            <p className="text-sm">
              Get notifications about new activities and updates from groups you've joined.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center">
              <span className="text-accent-primary mr-2">✓</span>
              Build Network
            </h3>
            <p className="text-sm">
              Meet new people, make friends, and expand your social circle in Bhopal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Groups