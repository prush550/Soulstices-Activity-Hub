import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ActivityCard from '../components/ActivityCard'

function Home() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          groups:group_id (
            name
          )
        `)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      // Transform data to match old format
      const transformedData = data.map(activity => ({
        ...activity,
        groupName: activity.groups?.name || 'Unknown Group'
      }))

      setActivities(transformedData)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching activities:', error)
      setLoading(false)
    }
  }

  const getFilteredActivities = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return activities.filter(activity => {
      const activityDate = new Date(activity.date)
      activityDate.setHours(0, 0, 0, 0)

      if (filter === 'today') {
        return activityDate.getTime() === today.getTime()
      } else if (filter === 'week') {
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return activityDate >= today && activityDate <= weekFromNow
      } else if (filter === 'all') {
        return activityDate >= today
      }
      return true
    })
  }

  const filteredActivities = getFilteredActivities()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading activities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 fade-in-up">
        <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 text-gradient leading-tight">
          What can I do today evening?
        </h1>
        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
          Discover sports and leisure activities happening in Bhopal right now
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center space-x-4 mb-8">
        <button
          onClick={() => setFilter('today')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            filter === 'today'
              ? 'bg-gradient-emerald text-text-primary shadow-button'
              : 'glass text-text-secondary hover:text-text-primary hover:bg-dark-card-hover'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            filter === 'week'
              ? 'bg-gradient-emerald text-text-primary shadow-button'
              : 'glass text-text-secondary hover:text-text-primary hover:bg-dark-card-hover'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-gradient-emerald text-text-primary shadow-button'
              : 'glass text-text-secondary hover:text-text-primary hover:bg-dark-card-hover'
          }`}
        >
          All Upcoming
        </button>
      </div>

      {/* Activities Grid */}
      {filteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map(activity => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-display font-bold text-text-primary mb-2">
            No activities found
          </h3>
          <p className="text-text-secondary">
            {filter === 'today'
              ? "No activities happening today. Try checking 'This Week'!"
              : "Check back soon for new activities!"}
          </p>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 glass rounded-2xl p-8 text-center border-t-2 border-transparent bg-gradient-brand bg-clip-border overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-brand opacity-5"></div>
        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold text-text-primary mb-4">
            Organizing activities in Bhopal?
          </h2>
          <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            Join Soulstices Activity Hub as a group admin and connect with your community
          </p>
          <button className="bg-gradient-gold text-text-primary px-8 py-3 rounded-lg font-bold shadow-button-gold hover:-translate-y-1 transition-all">
            Become a Group Admin
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home