import { Link } from 'react-router-dom'
import { HardDrive } from 'lucide-react'
import Logo from './Logo'

const columns = [
  {
    title: 'Explore',
    links: [
      { to: '/learn', label: 'Learn' },
      { to: '/lab', label: 'Investigation Lab' },
      { to: '/quiz', label: 'Quiz' },
      { to: '/toolkit', label: 'Verification Toolkit' },
    ],
  },
  {
    title: 'Project',
    links: [
      { to: '/about', label: 'About VerifyIT' },
      { to: '/results', label: 'My Progress' },
      { to: '/certificate', label: 'Certificate' },
      { to: '/verify-certificate', label: 'Verify a Certificate' },
      { to: '/about#references', label: 'References' },
      { to: '/about#team', label: 'Team' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="text-slate-600">
      <div className="mx-auto max-w-7xl border-t border-slate-200/80 px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-block rounded-md" aria-label="VerifyIT home">
              <Logo />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              A digital literacy campaign against online misinformation. Learn to pause, investigate, and share
              responsibly.
            </p>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
              <HardDrive className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              No account needed: guest progress stays in this browser. Sign in to save it to your account and claim your certificate.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="font-sans text-sm font-semibold text-navy-900">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="rounded text-sm text-slate-600 transition-colors hover:text-navy-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>VerifyIT: A Digital Literacy Campaign Against Online Misinformation. An STS class project.</p>
          <p>All posts, accounts, and places in practice scenarios are fictional.</p>
        </div>
      </div>
    </footer>
  )
}
