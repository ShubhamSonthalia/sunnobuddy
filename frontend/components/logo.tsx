import Image from 'next/image'

type LogoVariant = 'full' | 'compact' | 'mascot'

type LogoProps = {
  variant?: LogoVariant
  alt?: string
  className?: string
  priority?: boolean
}

export function Logo({ variant = 'full', alt = 'SunnoBuddy mascot', className, priority = false }: LogoProps) {
  if (variant === 'mascot') {
    return (
      <Image
        src="/sunnobuddy-mascot.png"
        alt={alt}
        width={1056}
        height={751}
        sizes="(max-width: 600px) 80vw, 430px"
        priority={priority}
        className={className}
      />
    )
  }

  return (
    <span className={`logo-lockup logo-lockup-${variant}${className ? ` ${className}` : ''}`}>
      <Image
        src="/sunnobuddy-mascot.png"
        alt=""
        width={1056}
        height={751}
        sizes="54px"
        priority={priority}
        className="logo-lockup-mascot"
      />
      <strong className="logo-wordmark" aria-label="SunnoBuddy">
        <span>Sunno</span><span>Buddy</span>
      </strong>
    </span>
  )
}
