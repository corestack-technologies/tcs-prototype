import { useState } from 'react'
import { Logo, Button, Field, Input, Select } from './ui'
import type { View, NavMeta } from '../App'

interface SignupProps { navigate: (v: View, meta?: NavMeta) => void }

const languages = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin']

const Icon = ({ path, className = 'h-4 w-4' }: { path: string; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={path} />
  </svg>
)

const icons = {
  check: 'M20 6L9 17l-5-5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bank: 'M3 10l9-6 9 6M5 10v9m4-9v9m6-9v9m4-9v9M3 19h18',
  users: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m13 10v-2a4 4 0 00-3-3.87m-3-11.26a4 4 0 010 7.75',
}

export function Signup({ navigate }: SignupProps) {
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '',
    phone: '', email: '', password: '', language: '', agree: false,
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (k: keyof typeof form, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName) e.firstName = 'First name is required'
    if (!form.lastName) e.lastName = 'Last name is required'
    if (!form.phone) e.phone = 'Phone number is required'
    else if (!/^(\+234|0)\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid Nigerian phone number'
    if (!form.email) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.agree) e.agree = 'You must accept the terms to continue'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('otp') }, 1400)
  }

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong']
  const strengthColor = ['', 'bg-[var(--tcs-danger)]', 'bg-[var(--tcs-warning)]', 'bg-[var(--tcs-success)]']

  return (
    <div className="min-h-screen tcs-page">
      <div className="grid min-h-screen lg:grid-cols-[420px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[var(--tcs-brand-900)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--tcs-radius-md)] bg-white text-[var(--tcs-brand-900)]">
              <Icon path={icons.shield} className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold leading-none">TCS</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#bcd4ff]">Thrift Core System</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#9cc7ff]">Member onboarding</p>
            <h1 className="display-font text-3xl font-extrabold leading-tight">Start with a secure TCS identity.</h1>
            <p className="mt-4 text-sm leading-6 text-[#d6e5ff]">
              Your account becomes the trusted profile used for membership requests, organization eligibility and payout records.
            </p>
            <div className="mt-8 space-y-3">
              {[
                [icons.shield, 'Identity-first participation'],
                [icons.bank, 'Bank details collected later in KYC'],
                [icons.users, 'Built for members and organizers'],
                [icons.check, 'Auditable activity from day one'],
              ].map(([path, label]) => (
                <div key={label} className="flex items-center gap-3 rounded-[var(--tcs-radius-md)] border border-white/12 bg-white/[0.07] px-4 py-3 text-sm text-[#e8f1ff]">
                  <Icon path={path} className="h-4 w-4 text-[#9cc7ff]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--tcs-radius-md)] border border-white/12 bg-white/[0.07] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9cc7ff]">Step 1 of 7</p>
            <p className="mt-1 text-sm text-[#d6e5ff]">Create account, then verify phone and identity.</p>
          </div>
        </aside>

        <main className="flex min-h-screen justify-center px-5 py-7 sm:px-8 lg:items-center">
          <div className="w-full max-w-[620px]">
            <div className="mb-7 flex items-center justify-between gap-4 lg:hidden">
              <Logo />
              <button onClick={() => navigate('login')} className="tcs-link text-sm">Sign in</button>
            </div>

            <div className="tcs-surface-raised rounded-[var(--tcs-radius-xl)] p-5 sm:p-7">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="tcs-label mb-2">Create account</p>
                  <h2 className="display-font text-2xl font-extrabold text-[var(--tcs-text)]">Join TCS</h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">Set up a secure profile for thrift participation.</p>
                </div>
                <div className="hidden text-right text-xs text-[var(--tcs-text-muted)] sm:block">
                  Already registered?<br />
                  <button onClick={() => navigate('login')} className="tcs-link">Sign in</button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" required error={errors.firstName}>
                    <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Adaeze" error={!!errors.firstName} />
                  </Field>
                  <Field label="Last name" required error={errors.lastName}>
                    <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Okonkwo" error={!!errors.lastName} />
                  </Field>
                </div>

                <Field label="Middle name" hint="Optional">
                  <Input value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Chidinma" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone number" required error={errors.phone} hint="Format: 0801 234 5678 or +234...">
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      placeholder="0801 234 5678"
                      error={!!errors.phone}
                      prefix={<span className="text-xs font-bold text-[var(--tcs-text-muted)]">NG</span>}
                    />
                  </Field>
                  <Field label="Preferred language" hint="Used for notifications">
                    <Select value={form.language} onChange={e => set('language', e.target.value)}>
                      <option value="">Select language</option>
                      {languages.map(l => <option key={l} value={l}>{l}</option>)}
                    </Select>
                  </Field>
                </div>

                <Field label="Email address" required error={errors.email}>
                  <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="adaeze@email.com" error={!!errors.email} />
                </Field>

                <Field label="Password" required error={errors.password}>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="At least 8 characters"
                    error={!!errors.password}
                    suffix={
                      <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs font-bold text-[var(--tcs-brand)] hover:text-[var(--tcs-brand-800)]">
                        {showPw ? 'Hide' : 'Show'}
                      </button>
                    }
                  />
                  {form.password.length > 0 && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-[var(--tcs-border)]'}`} />
                        ))}
                      </div>
                      <span className={`text-xs font-bold ${strength === 1 ? 'text-[var(--tcs-danger)]' : strength === 2 ? 'text-[var(--tcs-warning)]' : 'text-[var(--tcs-success)]'}`}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </Field>

                <div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-[var(--tcs-surface-blue)] p-3">
                    <input
                      type="checkbox"
                      checked={form.agree}
                      onChange={e => set('agree', e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--tcs-brand)]"
                    />
                    <span className="text-sm leading-6 text-[var(--tcs-text-soft)]">
                      I agree to TCS's{' '}
                      <button type="button" className="tcs-link">Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="tcs-link">Privacy Policy</button>.
                      I understand my information will be used to verify identity for thrift group participation.
                    </span>
                  </label>
                  {errors.agree && <p className="mt-1.5 ml-7 text-xs font-medium text-[var(--tcs-danger)]">{errors.agree}</p>}
                </div>

                <Button type="submit" size="lg" loading={loading} className="w-full">
                  Create account
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
