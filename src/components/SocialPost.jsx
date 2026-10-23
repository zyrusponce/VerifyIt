import { BadgeCheck, Coffee, Fuel, Globe, Heart, Megaphone, MessageCircle, Play, Quote, Repeat2, Waves, Image } from 'lucide-react'

const imageVariants = {
  flood: { className: 'bg-slate-700', icon: Waves },
  coffee: { className: 'bg-amber-900', icon: Coffee },
  advisory: { className: 'bg-navy-800', icon: Megaphone },
  quote: { className: 'bg-slate-800', icon: Quote },
  video: { className: 'bg-slate-900', icon: Play },
  fuel: { className: 'bg-orange-800', icon: Fuel },
}

/**
 * The post's picture. Cases use illustrations drawn for VerifyIT (public/case-images/), never real photos;
 * each one carries a "VerifyIT illustration" label. Without a src, a described placeholder is shown instead.
 */
export function PostImage({ variant, alt, src }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width="640"
        height="360"
        loading="lazy"
        decoding="async"
        className="block aspect-[16/9] w-full rounded-md bg-slate-200 object-cover"
      />
    )
  }

  const config = imageVariants[variant] ?? { className: 'bg-slate-700', icon: Image }
  const Icon = config.icon

  return (
    <div
      role="img"
      aria-label={alt}
      className={`keep-palette relative flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-md text-white ${config.className}`}
    >
      <span className="grid size-14 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-3 max-w-[85%] text-center text-xs leading-snug text-white/85" aria-hidden="true">
        {alt}
      </p>
    </div>
  )
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

/** A realistic-looking (but fictional) social media post or shared article. */
export default function SocialPost({ post }) {
  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white" aria-label={`Post by ${post.accountName}`}>
      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-100 text-sm font-bold text-navy-800" aria-hidden="true">
            {initials(post.accountName)}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1 font-semibold text-navy-900">
              <span className="truncate">{post.accountName}</span>
              {post.verified && (
                <BadgeCheck className="size-4 shrink-0 text-cyan-600" aria-label="Verified account" role="img" />
              )}
            </p>
            <p className="truncate text-xs text-slate-500">{post.handle}</p>
            <p className="mt-0.5 text-xs text-slate-500">{post.accountInfo}</p>
          </div>
        </header>

        <p className="mt-2 text-xs font-medium text-slate-500">{post.date}</p>

        {post.type === 'article' ? (
          <>
            {post.text && <p className="mt-3 text-[15px] leading-relaxed text-slate-800">{post.text}</p>}
            <div className="mt-4 overflow-hidden rounded-md border border-slate-200">
              {post.image && <PostImage variant={post.image.variant} alt={post.image.alt} src={post.image.src} />}
              <div className="bg-slate-50 p-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-slate-500">
                  <Globe className="size-3.5" aria-hidden="true" />
                  {post.handle}
                </p>
                <p className="mt-1 font-display text-lg font-bold leading-snug text-navy-900">{post.headline}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-800">{post.text}</p>
            {post.image && (
              <div className="mt-4">
                <PostImage variant={post.image.variant} alt={post.image.alt} src={post.image.src} />
              </div>
            )}
          </>
        )}
      </div>

      {post.stats && (
        <footer className="flex items-center gap-5 border-t border-slate-100 px-4 py-3 text-xs font-medium text-slate-500 sm:px-5">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-4" aria-hidden="true" />
            {post.stats.likes}
            <span className="sr-only">likes</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-4" aria-hidden="true" />
            {post.stats.comments}
            <span className="sr-only">comments</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Repeat2 className="size-4" aria-hidden="true" />
            {post.stats.shares}
            <span className="sr-only">shares</span>
          </span>
        </footer>
      )}
    </article>
  )
}
