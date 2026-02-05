// ProCreators Logo Component
// Clean, professional logo with stylized "P" and radiating elements

export function Logo({ className = "h-8 w-8", variant = "default", showText = true }) {
  const iconOnly = variant === "icon"
  
  const LogoSVG = ({ size = className }) => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={size}
    >
      {/* Background circle with gradient */}
      <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradient)" />
      
      {/* Main "P" letterform */}
      <path
        d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Radiating star/spark accent - top right */}
      <path
        d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
        fill="white"
        opacity="0.9"
      />
      
      {/* Small accent dots */}
      <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
      <circle cx="72" cy="54" r="2" fill="white" opacity="0.4" />
      
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  )
  
  if (iconOnly) {
    return <LogoSVG />
  }
  
  // Full logo with text
  return (
    <div className="flex items-center gap-2">
      <LogoSVG />
      {showText && (
        <span className="text-xl font-bold text-foreground">
          ProCreators
        </span>
      )}
    </div>
  )
}

// Icon-only version for compact use
export function LogoMark({ className = "h-10 w-10" }) {
  return <Logo variant="icon" className={className} />
}

// Square logo icon for use in cards/buttons
export function LogoIcon({ className = "h-10 w-10" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background */}
      <rect x="5" y="5" width="90" height="90" rx="22" fill="url(#bgGradientIcon)" />
      
      {/* P letterform */}
      <path
        d="M32 28 L32 72 M32 28 L54 28 C64 28 72 36 72 46 C72 56 64 64 54 64 L32 64"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Star accent */}
      <path
        d="M68 22 L70 28 L76 28 L71 32 L73 38 L68 34 L63 38 L65 32 L60 28 L66 28 Z"
        fill="white"
        opacity="0.9"
      />
      
      <circle cx="76" cy="44" r="3" fill="white" opacity="0.6" />
      
      <defs>
        <linearGradient id="bgGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default Logo
