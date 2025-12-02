export function FeatureIcon({ icon: Icon, className = "" }) {
  return (
    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#a78bfa]/20 text-[#a78bfa] transition-all group-hover:from-[#7c3aed]/40 group-hover:to-[#a78bfa]/40 group-hover:scale-110 ${className}`}>
      <Icon className="h-7 w-7" />
    </div>
  )
}

export function ToolIcon({ icon: Icon, variant = "default", size = "md" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }
  
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  }
  
  if (variant === "gradient") {
    return (
      <div className={`inline-flex ${sizeClasses[size]} items-center justify-center rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a78bfa] shadow-lg shadow-[#7c3aed]/50`}>
        <Icon className={`${iconSizes[size]} text-white`} />
      </div>
    )
  }
  
  if (variant === "outline") {
    return (
      <div className={`inline-flex ${sizeClasses[size]} items-center justify-center rounded-xl border-2 border-[#7c3aed]/50 bg-[#7c3aed]/10`}>
        <Icon className={`${iconSizes[size]} text-[#a78bfa]`} />
      </div>
    )
  }
  
  return (
    <div className={`inline-flex ${sizeClasses[size]} items-center justify-center rounded-xl bg-white/5 border border-white/10`}>
      <Icon className={`${iconSizes[size]} text-[#a78bfa]`} />
    </div>
  )
}
