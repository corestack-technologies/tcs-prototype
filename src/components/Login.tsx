import { useState } from 'react'
import { Logo, Button, Field, Input, Alert } from './ui'
import type { View, NavMeta } from '../App'

interface LoginProps { navigate: (v: View, meta?: NavMeta) => void }

const Icon = ({ path, className = 'h-4 w-4' }: { path: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
)

const icons = {
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  check: 'M20 6L9 17l-5-5',
  chart: 'M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-8',
  bell: 'M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7m-8 11a2 2 0 004 0',
}

const demoRows = [
  ['Active member', 'any email'],
  ['New user', 'new@tcs.ng'],
  ['Organization owner', 'owner@tcs.ng'],
  ['Eligible for org', 'eligible@tcs.ng'],
  ['KYC reviewer', 'reviewer@tcs.ng'],
  ['Org reviewer', 'org-reviewer@tcs.ng'],
]

export function Login({ navigate }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (email === 'reviewer@tcs.ng') navigate('reviewer-queue')
      else if (email === 'org-reviewer@tcs.ng') navigate('org-review-queue')
      else if (email === 'owner@tcs.ng') navigate('owner-dashboard')
      else if (email === 'eligible@tcs.ng') navigate('org-opportunity')
      else if (email.includes('new')) navigate('dashboard-new')
      else navigate('dashboard')
    }, 1400)
  }

  return (
    <div className="min-h-screen tcs-page">
      <div className="grid min-h-screen lg:grid-cols-[minmax(440px,0.95fr)_1.15fr]">
        <section className="relative hidden overflow-hidden bg-[var(--tcs-brand-900)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(21,84,192,0.38),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--tcs-radius-md)] bg-white text-[var(--tcs-brand-900)]">
              <svg viewBox="0 0 40 40" fill="none" className="h-4/5 w-4/5" aria-hidden="true">
                <path d="M10 25.5c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
                <circle cx="20" cy="13.5" r="4.2" fill="#d6e5ff" stroke="currentColor" strokeWidth="2" />
                <path d="M8 29h24M12 33h16" stroke="#1554c0" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none text-white">TCS</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#bcd4ff]">Thrift Core System</p>
            </div>
          </div>

          <div className="relative max-w-md">
            <div className="mb-5 inline-flex items-center gap-2 rounded-[var(--tcs-radius-sm)] border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#bcd4ff]">
              <Icon path={icons.shield} className="h-3.5 w-3.5" />
              Trusted thrift operations
            </div>
            <h1 className="display-font text-4xl font-extrabold leading-tight tracking-normal">
              Coordinate Ajo groups with clarity, control and trust.
            </h1>
            <p className="mt-5 text-base leading-7 text-[#d6e5ff]">
              TCS gives members, organization owners and internal reviewers one auditable workspace for contributions, group health and payout readiness.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              {[
                ['Verified members', '28,000+'],
                ['Tracked contributions', 'NGN 480M+'],
                ['Active organizations', '1,240+'],
                ['Audit coverage', '100%'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[var(--tcs-radius-md)] border border-white/12 bg-white/[0.07] p-4">
                  <p className="tcs-kpi text-2xl font-extrabold">{value}</p>
                  <p className="mt-1 text-xs font-medium text-[#bcd4ff]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 text-xs text-[#d6e5ff]">
            {[
              [icons.check, 'Provider independent'],
              [icons.chart, 'Operational visibility'],
              [icons.bell, 'Actionable alerts'],
            ].map(([path, label]) => (
              <div key={label} className="flex items-center gap-2 rounded-[var(--tcs-radius-sm)] border border-white/10 bg-white/[0.06] px-3 py-2">
                <Icon path={path} className="h-3.5 w-3.5 text-[#9cc7ff]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>

            <div className="tcs-surface-raised rounded-[var(--tcs-radius-xl)] p-5 sm:p-7">
              <div className="mb-7">
                <p className="tcs-label mb-2">Secure access</p>
                <h2 className="display-font text-2xl font-extrabold text-[var(--tcs-text)]">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">Sign in to continue managing your thrift activity.</p>
              </div>

              {error && <Alert type="error" className="mb-4">{error}</Alert>}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <Field label="Email address" required>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                <Field label="Password" required>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    suffix={
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs font-bold text-[var(--tcs-brand)] hover:text-[var(--tcs-brand-800)]">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                </Field>

                <div className="flex justify-end">
                  <button type="button" className="tcs-link text-xs">Forgot password?</button>
                </div>

                <Button type="submit" size="lg" loading={loading} className="w-full">
                  Sign in
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[var(--tcs-text-muted)]">
                New to TCS?{' '}
                <button onClick={() => navigate('signup')} className="tcs-link">Create an account</button>
              </p>
            </div>

            <div className="mt-5 rounded-[var(--tcs-radius-lg)] border border-[var(--tcs-border)] bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="tcs-label">Demo credentials</p>
                <span className="text-xs font-semibold text-[var(--tcs-text-muted)]">Any password</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {demoRows.map(([role, demoEmail]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setEmail(demoEmail === 'any email' ? 'member@tcs.ng' : demoEmail)}
                    className="rounded-[var(--tcs-radius-sm)] border border-transparent px-3 py-2 text-left transition-colors hover:border-[var(--tcs-border)] hover:bg-white"
                  >
                    <p className="text-xs font-bold text-[var(--tcs-text)]">{role}</p>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--tcs-text-muted)]">{demoEmail}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
