import { useNavigate } from 'react-router-dom'

function ActivityCard({ activity }) {
  const navigate = useNavigate()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })
    }
  }

  const formatTime = (time) => {
    if (!time) return 'TBA'
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailabilityStatus = () => {
    if (!activity.participant_limit) return null
    const spotsLeft = activity.participant_limit - (activity.current_participants || 0)
    if (spotsLeft === 0) return { text: 'Full', color: 'text-red-400' }
    if (spotsLeft <= 3) return { text: `${spotsLeft} spots left`, color: 'text-yellow-400' }
    return { text: `${spotsLeft} spots available`, color: 'text-green-400' }
  }

  const availability = getAvailabilityStatus()

  return (
    <div 
      onClick={() => navigate(`/activity/${activity.id}`)}
      className="bg-dark-card border border-dark-border rounded-lg p-6 hover:border-accent-primary hover:shadow-lg hover:shadow-accent-primary/20 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-accent-primary">
            {activity.title}
          </h3>
          <p className="text-sm text-gray-400">{activity.groupName}</p>
        </div>
        {activity.type === 'private' && (
          <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full">
            Private
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-4">
        {/* Date and Time */}
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-accent-primary">📅</span>
          <span className="font-medium">{formatDate(activity.date)}</span>
          <span className="text-gray-500">•</span>
          <span>{formatTime(activity.start_time)} - {formatTime(activity.end_time)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-accent-primary">📍</span>
          <span>{activity.place}</span>
        </div>

        {/* Payment */}
        <div className="flex items-center space-x-2 text-gray-300">
          <span className="text-accent-primary">💰</span>
          <span className="font-semibold">{activity.payment}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-dark-border">
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-400">
            👥 {activity.current_participants || 0} joined
          </span>
          {availability && (
            <span className={`${availability.color} font-medium`}>
              {availability.text}
            </span>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/activity/${activity.id}`)
          }}
          className="bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default ActivityCard