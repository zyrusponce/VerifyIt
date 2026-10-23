const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

/**
 * Rounded card with a subtle border. Use `interactive` for cards that
 * respond to hover (for example, cards wrapped in a link).
 */
export default function Card({ as: Tag = 'div', padding = 'md', interactive = false, className = '', children, ...rest }) {
  const hover = interactive
    ? 'transition duration-200 hover:-translate-y-0.5 hover:border-navy-300'
    : ''

  return (
    <Tag
      className={`rounded-md border border-slate-200/80 bg-white ${paddings[padding]} ${hover} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
