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
      className="glass rounded-2xl p-6 hover:border-emerald/30 hover:shadow-card hover:-translate-y-1 cursor-pointer group transition-all duration-300 relative overflow-hidden"
    >
      {/* Top gradient border on hover */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity"></div>

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-display font-semibold text-text-primary mb-1 group-hover:text-gradient">
            {activity.title}
          </h3>
          <p className="text-sm text-text-secondary font-body">{activity.groupName}</p>
        </div>
        {activity.type === 'private' && (
          <span className="bg-emerald/15 border border-emerald/30 text-emerald text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
            Private
          </span>
        )}
      </div>

      {/* Details Grid */}
      <div className="space-y-3 mb-4">
        {/* Date and Time */}
        <div className="flex items-center space-x-2 text-text-secondary font-body text-[15px]">
          <span className="text-emerald">📅</span>
          <span className="font-medium text-text-primary">{formatDate(activity.date)}</span>
          <span className="text-text-muted">•</span>
          <span>{formatTime(activity.start_time)} - {formatTime(activity.end_time)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-2 text-text-secondary font-body text-[15px]">
          <span className="text-gold">📍</span>
          <span>{activity.place}</span>
        </div>

        {/* Payment */}
        <div className="flex items-center space-x-2 text-text-secondary font-body text-[15px]">
          <span className="text-emerald-light">💰</span>
          <span className="font-semibold text-text-primary">{activity.payment}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-emerald/10">
        <div className="flex items-center space-x-4 text-[13px] font-body">
          <span className="text-text-secondary">
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
          className="bg-gradient-emerald text-dark-bg px-6 py-2.5 rounded-lg text-sm font-medium font-body shadow-button hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default ActivityCard