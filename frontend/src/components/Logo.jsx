const Logo = ({ size = 'default' }) => {
  const dimensions = {
    small: { svg: 48, text: 'text-2xl', subtitle: 'text-[9px]' },
    default: { svg: 60, text: 'text-[32px]', subtitle: 'text-[11px]' },
    large: { svg: 80, text: 'text-5xl', subtitle: 'text-xs' }
  }

  const { svg, text, subtitle } = dimensions[size]

  return (
    <div className="flex items-center gap-3">
      {/* Orbital Ball Logo */}
      <svg
        width={svg}
        height={svg}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 20px rgba(45, 212, 168, 0.3))' }}
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2dd4a8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#d4a72c', stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="logoBall" cx="35%" cy="35%">
            <stop offset="0%" style={{ stopColor: '#3fefbf', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#2dd4a8', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1a8f70', stopOpacity: 1 }} />
          </radialGradient>
        </defs>

        {/* Orbital rings */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.3" strokeDasharray="4,3"/>
        <circle cx="50" cy="50" r="32" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.4"/>
        <circle cx="50" cy="50" r="23" fill="none" stroke="url(#logoGrad)" strokeWidth="1.5" opacity="0.5"/>

        {/* Activity dots (8 outer dots) */}
        <circle cx="50" cy="8" r="3" fill="#2dd4a8" opacity="0.8"/>
        <circle cx="79.5" cy="20.5" r="3" fill="#d4a72c" opacity="0.8"/>
        <circle cx="92" cy="50" r="3" fill="#2dd4a8" opacity="0.8"/>
        <circle cx="79.5" cy="79.5" r="3" fill="#d4a72c" opacity="0.8"/>
        <circle cx="50" cy="92" r="3" fill="#2dd4a8" opacity="0.8"/>
        <circle cx="20.5" cy="79.5" r="3" fill="#d4a72c" opacity="0.8"/>
        <circle cx="8" cy="50" r="3" fill="#2dd4a8" opacity="0.8"/>
        <circle cx="20.5" cy="20.5" r="3" fill="#d4a72c" opacity="0.8"/>

        {/* Activity dots (6 middle dots) */}
        <circle cx="50" cy="18" r="2.5" fill="#3fefbf" opacity="0.7"/>
        <circle cx="73" cy="36" r="2.5" fill="#f5c842" opacity="0.7"/>
        <circle cx="73" cy="64" r="2.5" fill="#3fefbf" opacity="0.7"/>
        <circle cx="50" cy="82" r="2.5" fill="#f5c842" opacity="0.7"/>
        <circle cx="27" cy="64" r="2.5" fill="#3fefbf" opacity="0.7"/>
        <circle cx="27" cy="36" r="2.5" fill="#f5c842" opacity="0.7"/>

        {/* Central ball */}
        <circle cx="50" cy="50" r="19" fill="url(#logoBall)" stroke="url(#logoGrad)" strokeWidth="2"/>

        {/* Ball texture lines */}
        <path d="M 35 46 Q 50 43, 65 46" stroke="#e8f2ed" strokeWidth="1.5" fill="none" opacity="0.3"/>
        <path d="M 35 54 Q 50 57, 65 54" stroke="#e8f2ed" strokeWidth="1.5" fill="none" opacity="0.3"/>

        {/* Ball highlight */}
        <circle cx="43.5" cy="43.5" r="5" fill="#e8f2ed" opacity="0.2"/>
        <circle cx="42" cy="42" r="2.5" fill="#e8f2ed" opacity="0.3"/>
      </svg>

      {/* Logo Text */}
      <div className="flex flex-col">
        <h1 className={`${text} font-display font-semibold text-text-primary leading-none`}>
          Soulstices
        </h1>
        <p className={`${subtitle} font-body font-light text-text-secondary tracking-[1.5px] uppercase`}>
          Activity Hub
        </p>
      </div>
    </div>
  )
}

export default Logo
