import { ShieldCheck } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`keep-palette grid size-9 place-items-center rounded-md ${light ? 'bg-white/10 text-cyan-300' : 'bg-navy-900 text-cyan-300'}`}
        aria-hidden="true"
      >
        <ShieldCheck className="size-5" strokeWidth={2.25} />
      </span>
      <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Verify<span className={light ? 'text-cyan-300' : 'text-cyan-600'}>IT</span>
      </span>
    </span>
  )
}
