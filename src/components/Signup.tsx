import { useState } from 'react'
import { AuthLayout, EntryProgress } from '../auth/AuthLayout'
import { Button, Field, Input, Select, Alert } from './ui'
import { useClient } from '../clients/ClientContext'
import type { View, NavMeta } from '../App'

interface SignupProps { navigate: (v: View, meta?: NavMeta) => void }

const languages = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin']

export function Signup({ navigate }: SignupProps) {
  const { register } = useClient()
  const [serviceError, setServiceError] = useState('')
  const [legalNotice, setLegalNotice] = useState(false)
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
    if (!form.firstName.trim()) e.firstName = 'First name is required'
    if (!form.lastName.trim()) e.lastName = 'Last name is required'
    if (!form.phone) e.phone = 'Phone number is required'
    else if (!/^(\+234|0)\d{10}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid Nigerian phone number'
    if (!form.email) e.email = 'Email address is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!form.agree) e.agree = 'Please acknowledge the local prototype notice to continue'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setServiceError('')
    try {
      await register({ firstName: form.firstName.trim(), middleName: form.middleName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), phone: form.phone.replace(/\s/g, ''), language: form.language || 'English' }, form.password)
      navigate('otp')
    } catch (error) { setServiceError(error instanceof Error ? error.message : 'Could not create your local account. Please try again.') }
    finally { setLoading(false) }
  }

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong']
  const strengthColor = ['', 'bg-[var(--tcs-danger)]', 'bg-[var(--tcs-warning)]', 'bg-[var(--tcs-success)]']

  return (
    <AuthLayout wide>
      <EntryProgress current={0}/>
            <div className="auth-card">
              <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="tcs-label mb-2">Create account</p>
                  <h1 className="auth-title">Join TCS</h1>
                  <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">Set up a secure profile for thrift participation.</p>
                </div>
                <div className="text-right text-xs text-[var(--tcs-text-muted)]">
                  Already registered?<br />
                  <button onClick={() => navigate('login')} className="tcs-link">Sign in</button>
                </div>
              </div>

              <p className="mb-4 text-sm leading-6 text-[var(--tcs-text-muted)]">Create a local prototype account using sample details. No account is created on a server; reloading clears this session.</p>
              {serviceError && <Alert type="error" className="mb-4">{serviceError}</Alert>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4"><fieldset className="space-y-4"><legend className="mb-3 text-sm font-semibold">About you</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="First name" required error={errors.firstName}>
                    <Input autoComplete="given-name" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Adaeze" error={!!errors.firstName} />
                  </Field>
                  <Field label="Last name" required error={errors.lastName}>
                    <Input autoComplete="family-name" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Okonkwo" error={!!errors.lastName} />
                  </Field>
                </div>

                <Field label="Middle name" hint="Optional">
                  <Input autoComplete="additional-name" value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Chidinma" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Phone number" required error={errors.phone} hint="Format: 0801 234 5678 or +234...">
                    <Input
                      type="tel" autoComplete="tel" inputMode="tel"
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

                </fieldset><fieldset className="space-y-4"><legend className="mb-3 text-sm font-semibold">Sign-in details</legend><Field label="Email address" required error={errors.email}>
                  <Input type="email" autoComplete="email" inputMode="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="adaeze@email.com" error={!!errors.email} />
                </Field>

                <Field label="Password" required error={errors.password}>
                  <Input
                    autoComplete="new-password" type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="At least 8 characters"
                    error={!!errors.password}
                    suffix={
                      <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw} onClick={() => setShowPw(!showPw)} className="text-xs font-bold text-[var(--tcs-brand)] hover:text-[var(--tcs-brand-800)]">
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

                </fieldset><div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[var(--tcs-radius-md)] border border-[var(--tcs-border)] bg-[var(--tcs-surface-blue)] p-3">
                    <input
                      type="checkbox"
                      checked={form.agree}
                      onChange={e => set('agree', e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[var(--tcs-brand)]"
                    />
                    <span className="text-sm leading-6 text-[var(--tcs-text-soft)]">
                      I understand this is a local prototype and will use sample information. Production{' '}
                      <button type="button" className="tcs-link" onClick={() => setLegalNotice(value => !value)}>Terms of Service</button>
                      {' '}and{' '}
                      <button type="button" className="tcs-link" onClick={() => setLegalNotice(value => !value)}>Privacy Policy</button>.
                      {' '}documents will be available before a real account is created.
                    </span>
                  </label>
                  {legalNotice && <p role="status" className="mt-3 text-sm leading-6 text-[var(--tcs-text-muted)]">Production Terms of Service and Privacy Policy are not connected here. This checkbox records a prototype interaction only, not acceptance of a published legal agreement.</p>}
                  {errors.agree && <p role="alert" className="mt-1.5 ml-7 text-xs font-medium text-[var(--tcs-danger)]">{errors.agree}</p>}
                </div>

                <Button type="submit" size="lg" loading={loading} className="w-full">
                  Create account
                </Button>
              </form>
            </div>
    </AuthLayout>
  )
}
