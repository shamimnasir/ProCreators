export function Logo({ className = "h-8 w-8", variant = "default" }) {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Outer glow circle */}
        <circle cx="50" cy="50" r="45" fill="url(#glow)" opacity="0.2" />
        
        {/* Main icon - stylized P with sparkle */}
        <path
          d="M30 25 L30 75 M30 25 L55 25 C62 25 67 30 67 37 C67 44 62 49 55 49 L30 49"
          stroke="url(#gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Sparkle elements */}
        <circle cx="70" cy="30" r="3" fill="#a78bfa" />
        <circle cx="75" cy="40" r="2" fill="#c4b5fd" />
        <circle cx="65" cy="40" r="2" fill="#c4b5fd" />
        
        {/* Star accent */}
        <path
          d="M70 25 L71 28 L74 28 L71.5 30 L72.5 33 L70 31 L67.5 33 L68.5 30 L66 28 L69 28 Z"
          fill="#7c3aed"
        />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <radialGradient id="glow">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    )
  }
  
  // Full logo with text
  return (
    <div className="flex items-center gap-2 group">
      <div className="relative">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="50" cy="50" r="45" fill="url(#glow)" opacity="0.2" />
          <path
            d="M30 25 L30 75 M30 25 L55 25 C62 25 67 30 67 37 C67 44 62 49 55 49 L30 49"
            stroke="url(#gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="70" cy="30" r="3" fill="#a78bfa" />
          <circle cx="75" cy="40" r="2" fill="#c4b5fd" />
          <circle cx="65" cy="40" r="2" fill="#c4b5fd" />
          <path
            d="M70 25 L71 28 L74 28 L71.5 30 L72.5 33 L70 31 L67.5 33 L68.5 30 L66 28 L69 28 Z"
            fill="#7c3aed"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 blur-xl bg-[#7c3aed]/30 group-hover:bg-[#7c3aed]/50 transition-all"></div>
      </div>
      {variant === "full" && (
        <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          ProCreators
        </span>
      )}
    </div>
  )
}

export function LogoMark({ className = "h-10 w-10" }) {
  return <Logo variant="icon" className={className} />
}
