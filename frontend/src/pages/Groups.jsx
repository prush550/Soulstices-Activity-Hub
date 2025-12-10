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
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading groups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12 fade-in-up">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-text-primary mb-4">
          Discover Groups
        </h1>
        <p className="text-xl text-text-secondary">
          Join communities of sports and leisure enthusiasts in Bhopal
        </p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map(group => (
          <div
            key={group.id}
            onClick={() => navigate(`/group/${group.id}`)}
            className="glass rounded-2xl overflow-hidden hover:border-emerald/30 hover:shadow-lg hover:shadow-emerald/10 hover:-translate-y-1 cursor-pointer group transition-all"
          >
            {/* Group Cover */}
            <div className="h-48 bg-gradient-to-br from-emerald/10 to-gold/10 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-brand opacity-5"></div>
              <span className="text-6xl relative z-10">
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
                <h3 className="text-xl font-display font-bold text-text-primary mb-2 group-hover:text-emerald transition-colors">
                  {group.name}
                </h3>
                <span className="inline-block bg-emerald/15 border border-emerald/30 text-emerald text-sm px-3 py-1 rounded-full">
                  {group.category}
                </span>
              </div>

              <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                {group.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-text-secondary">
                  👥 {group.member_count || 0} members
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  group.joining_type === 'public'
                    ? 'bg-emerald/15 text-emerald border border-emerald/30'
                    : group.joining_type === 'invite_only'
                    ? 'bg-gold/15 text-gold border border-gold/30'
                    : 'bg-gold/15 text-gold border border-gold/30'
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
                className="w-full bg-gradient-emerald text-text-primary py-2 rounded-lg font-medium shadow-button hover:-translate-y-1 transition-all"
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
          <h3 className="text-2xl font-display font-bold text-text-primary mb-2">
            No groups yet
          </h3>
          <p className="text-text-secondary">
            Be the first to create a group and build your community!
          </p>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-16 glass rounded-2xl p-8">
        <h2 className="font-display text-2xl font-bold text-text-primary mb-4">
          How Groups Work
        </h2>
        <div className="grid md:grid-cols-2 gap-6 text-text-secondary">
          <div>
            <h3 className="font-semibold text-text-primary mb-2 flex items-center">
              <span className="text-emerald mr-2">✓</span>
              Join Communities
            </h3>
            <p className="text-sm">
              Connect with like-minded people who share your interests in sports and leisure activities.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2 flex items-center">
              <span className="text-emerald mr-2">✓</span>
              Exclusive Activities
            </h3>
            <p className="text-sm">
              Access private activities and events organized exclusively for group members.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2 flex items-center">
              <span className="text-emerald mr-2">✓</span>
              Stay Updated
            </h3>
            <p className="text-sm">
              Get notifications about new activities and updates from groups you've joined.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2 flex items-center">
              <span className="text-emerald mr-2">✓</span>
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