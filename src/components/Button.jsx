import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50'

const variants = {
  primary: 'bg-navy-900 text-white hover:bg-navy-800',
  secondary: 'border border-slate-200 bg-white text-navy-900 hover:border-navy-300 hover:bg-navy-50',
  accent: 'bg-cyan-400 text-navy-950 hover:bg-cyan-300',
  ghost: 'text-navy-700 hover:bg-navy-50',
  light: 'bg-white text-navy-900 hover:bg-navy-50',
  outlineLight: 'border border-white/30 text-white hover:bg-white/10',
  danger: 'bg-rose-700 text-white hover:bg-rose-800',
}

const sizes = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

/**
 * One button style for the whole site.
 * - Pass `to` for an internal page link (React Router).
 * - Pass `href` for an external link (opens in a new tab).
 * - Otherwise it renders a normal <button>.
 */
export default function Button({
  to,
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  const content = (
    <>
      {Icon && iconPosition === 'left' && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="size-4 shrink-0" aria-hidden="true" />}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
        {content}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}
