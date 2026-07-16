import { useState } from 'react'
import { Logo, Button, Field, Input, Select, Card, Alert } from './ui'
import type { View, NavMeta } from '../App'

interface SignupProps { navigate: (v: View, meta?: NavMeta) => void }

const languages = ['English', 'Yoruba', 'Igbo', 'Hausa', 'Pidgin']

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
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-500']

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-[380px] shrink-0 bg-[#1746A2] px-10 py-10">
        <Logo size="md" />
        <div>
          <div className="w-10 h-1 bg-[#7DD3FC] rounded-full mb-5" />
          <h2 className="display-font text-3xl font-800 text-white leading-tight mb-3">Join a trusted thrift community on TCS.</h2>
          <p className="text-[#BFDBFE] text-sm leading-relaxed">
            Set up your account in minutes. Participate in transparent, well-organized savings groups built on accountability and trust.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              'Secure identity verification',
              'Bank-grade data protection',
              'Instant payout eligibility tracking',
              'Works with all Nigerian banks',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#059669] flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="white">
                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <span className="text-[#BFDBFE] text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[#93C5FD] text-xs">Step 1 of 7 — Account creation</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          <div className="lg:hidden mb-6"><Logo size="md" /></div>

          <div className="mb-7">
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Create your account</h1>
            <p className="text-[#6B7280] text-sm">All fields marked * are required.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
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

            <Field label="Phone number" required error={errors.phone} hint="Format: 0801 234 5678 or +234...">
              <Input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="0801 234 5678"
                error={!!errors.phone}
                prefix={<span className="text-sm">🇳🇬</span>}
              />
            </Field>

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
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs font-medium text-[#1746A2] hover:underline">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                }
              />
              {form.password.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-[#E2E6F0]'}`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {strengthLabel[strength]}
                  </span>
                </div>
              )}
            </Field>

            <Field label="Preferred language" hint="We'll use this for notifications and communications">
              <Select value={form.language} onChange={e => set('language', e.target.value)}>
                <option value="">Select language</option>
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </Select>
            </Field>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={e => set('agree', e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#1746A2] cursor-pointer"
                />
                <span className="text-sm text-[#374151]">
                  I agree to TCS's{' '}
                  <button type="button" className="text-[#1746A2] hover:underline font-medium">Terms of Service</button>
                  {' '}and{' '}
                  <button type="button" className="text-[#1746A2] hover:underline font-medium">Privacy Policy</button>.
                  I understand that my information will be used to verify my identity for thrift group participation.
                </span>
              </label>
              {errors.agree && <p className="text-xs text-red-500 mt-1.5 ml-7">{errors.agree}</p>}
            </div>

            <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
              Create account — it's free
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-5">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="text-[#1746A2] font-semibold hover:underline">Sign in</button>
          </p>
        </div>
      </div>
    </div>
  )
}
