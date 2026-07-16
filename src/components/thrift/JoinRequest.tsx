import { useState } from 'react'
import { Button, Field, Textarea, Alert } from '../ui'
import { AppShell } from './AppShell'
import type { View, NavMeta } from '../../App'

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
  communityId?: string
}

const COMMUNITY = {
  id: 'c4',
  name: 'Mainland Savers Club',
  coordinator: 'Emeka Nwosu',
  amount: 50000,
  frequency: 'Monthly',
  pool: 750000,
  payoutDay: '1st of every month',
  spotsLeft: 2,
  color: '#D97706',
}

export function JoinRequest({ navigate, communityId }: Props) {
  const [motivation, setMotivation] = useState('')
  const [confirmSchedule, setConfirmSchedule] = useState(false)
  const [confirmBank, setConfirmBank] = useState(false)
  const [confirmRules, setConfirmRules] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const c = COMMUNITY

  const validate = () => {
    const e: Record<string, string> = {}
    if (!motivation.trim() || motivation.trim().length < 20) e.motivation = 'Please write at least a brief introduction (min 20 characters)'
    if (!confirmSchedule) e.schedule = 'Please confirm you can meet the contribution schedule'
    if (!confirmBank) e.bank = 'Please confirm your bank account is ready for payouts'
    if (!confirmRules) e.rules = 'Please confirm you have read and agree to the group rules'
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('join-submitted', { communityId: c.id })
    }, 1800)
  }

  const allConfirmed = confirmSchedule && confirmBank && confirmRules

  return (
    <AppShell navigate={navigate} activeView="discover">
      {/* Back bar */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-4">
        <button
          onClick={() => navigate('community-detail', { communityId: communityId })}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          {c.name}
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Request to join</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Community summary card */}
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: c.color + '18' }}>
              🏘
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#0D1117]">{c.name}</p>
              <p className="text-xs text-[#6B7280]">Coordinated by {c.coordinator}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#0D1117]">₦{c.amount.toLocaleString()}/month</p>
              <p className="text-xs text-[#059669] font-semibold">₦{c.pool.toLocaleString()} pool</p>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="display-font text-2xl font-bold text-[#0D1117] mb-1">Request to join</h1>
            <p className="text-sm text-[#6B7280]">
              Your request will be reviewed by the coordinator. They may check your TCS profile before approving.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Profile preview */}
            <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] p-5">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Your profile — what the coordinator will see</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1746A2] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold">
                  AO
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0D1117]">Adaeze Chidinma Okonkwo</p>
                  <p className="text-xs text-[#6B7280]">Lagos, Nigeria · Member since July 2025</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />Identity verified
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />Bank account linked
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#065F46] bg-[#D1FAE5] px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />0 groups · 0 infractions
                </span>
              </div>
            </div>

            {/* Motivation */}
            <Field
              label="Introduce yourself to the coordinator"
              required
              error={errors.motivation}
              hint="Tell the coordinator a bit about yourself and why you want to join this group. Be genuine — it helps build trust."
            >
              <Textarea
                value={motivation}
                onChange={e => setMotivation(e.target.value)}
                rows={5}
                placeholder="Hi Emeka, my name is Adaeze. I am a marketing professional based in Lagos Mainland. I am looking for a reliable savings group to help me build discipline around saving. I can comfortably meet the ₦50,000 monthly commitment and I am excited about the payout structure..."
                error={!!errors.motivation}
              />
              <p className="text-xs text-[#9CA3AF] text-right mt-1">{motivation.length} characters</p>
            </Field>

            {/* Commitment checkboxes */}
            <div className="bg-white rounded-xl border border-[#E2E6F0] p-5 flex flex-col gap-4">
              <p className="text-sm font-bold text-[#0D1117]">Confirm your commitments</p>

              {[
                {
                  key: 'schedule',
                  state: confirmSchedule,
                  setter: setConfirmSchedule,
                  error: errors.schedule,
                  label: `I can contribute ₦${c.amount.toLocaleString()} on the ${c.payoutDay} every month without fail.`,
                },
                {
                  key: 'bank',
                  state: confirmBank,
                  setter: setConfirmBank,
                  error: errors.bank,
                  label: 'My bank account (GTBank · 0123456789) is active and ready to receive payouts.',
                },
                {
                  key: 'rules',
                  state: confirmRules,
                  setter: setConfirmRules,
                  error: errors.rules,
                  label: "I have read the group's rules and I agree to abide by them. I understand that repeated defaults may result in removal.",
                },
              ].map(item => (
                <div key={item.key}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={e => item.setter(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#1746A2] cursor-pointer"
                    />
                    <span className={`text-sm leading-relaxed transition-colors ${item.state ? 'text-[#0D1117]' : 'text-[#6B7280]'}`}>
                      {item.label}
                    </span>
                  </label>
                  {item.error && (
                    <p className="text-xs text-[#DC2626] mt-1 ml-7">{item.error}</p>
                  )}
                </div>
              ))}
            </div>

            <Alert type="info" title="What happens after you submit?">
              The coordinator ({c.coordinator}) will review your profile and message within 48 hours. You'll receive a notification on TCS and via SMS when a decision is made.
            </Alert>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!allConfirmed}
              className="w-full"
            >
              {allConfirmed ? 'Send join request →' : 'Complete all commitments above'}
            </Button>

            <p className="text-xs text-center text-[#9CA3AF]">
              Your request is not a financial commitment. You can withdraw it at any time before approval.
            </p>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
