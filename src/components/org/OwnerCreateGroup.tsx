import { useState } from 'react'
import { Button, Alert } from '../ui'
import { OwnerShell } from './OwnerShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const STEPS = [
  { number: 1, label: 'Group details' },
  { number: 2, label: 'Cycle setup' },
  { number: 3, label: 'Rules' },
  { number: 4, label: 'Review' },
]

const FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly']
const PAYOUT_METHODS = ['Fixed order (set by owner before cycle)', 'Random lottery (assigned at cycle start)', 'First-come first-served (by join date)']

interface GroupForm {
  name: string; emoji: string; description: string
  maxMembers: string; amount: string; frequency: string
  cycleStart: string; payoutMethod: string
  rules: string[]
}

const EMOJIS = ['🏛', '🌊', '💼', '🌿', '🤝', '⭐', '🏠', '💫', '🌟', '🎯']

export function OwnerCreateGroup({ navigate }: Props) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<GroupForm>({
    name: '', emoji: '🏛', description: '',
    maxMembers: '', amount: '', frequency: 'Monthly',
    cycleStart: '', payoutMethod: PAYOUT_METHODS[0],
    rules: [
      'Contributions must be made on or before the due date.',
      'Late contributions attract an administrative charge.',
      'A member may not leave the group mid-cycle without a replacement.',
    ],
  })

  const [newRule, setNewRule] = useState('')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const set = <K extends keyof GroupForm>(k: K, v: GroupForm[K]) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: typeof errors = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Group name is required.'
    }
    if (step === 2) {
      if (!form.maxMembers || isNaN(+form.maxMembers) || +form.maxMembers < 2) e.maxMembers = 'Enter a valid number of members (minimum 2).'
      if (!form.amount || isNaN(+form.amount.replace(/,/g, '')) || +form.amount.replace(/,/g, '') < 100) e.amount = 'Enter a valid contribution amount.'
      if (!form.cycleStart) e.cycleStart = 'Please select a cycle start date.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 4)) }
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('owner-groups')
    }, 1600)
  }

  const addRule = () => {
    if (!newRule.trim()) return
    set('rules', [...form.rules, newRule.trim()])
    setNewRule('')
  }

  const removeRule = (i: number) => set('rules', form.rules.filter((_, idx) => idx !== i))

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups">
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('owner-groups')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          My groups
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Create group</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-xl">

          {/* Step indicator */}
          <div className="mb-7">
            <div className="flex items-center gap-2 mb-2">
              {STEPS.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === s.number ? 'bg-[#1746A2] text-white' : step > s.number ? 'bg-[#059669] text-white' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                    {step > s.number ? '✓' : s.number}
                  </div>
                  {i < STEPS.length - 1 && <div className={`h-px flex-1 min-w-[20px] ${step > s.number ? 'bg-[#059669]' : 'bg-[#E2E6F0]'}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF]">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
          </div>

          <form onSubmit={submit}>

            {/* Step 1 — Group details */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Group details</h1>
                  <p className="text-sm text-[#6B7280]">Name and describe your new thrift group.</p>
                </div>

                {/* Emoji picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0D1117]">Group icon</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => set('emoji', e)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all ${form.emoji === e ? 'border-[#1746A2] bg-[#EEF2FF]' : 'border-[#E2E6F0] hover:border-[#C7D2FE]'}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0D1117]">Group name <span className="text-[#DC2626]">*</span></label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Victoria Island Professional Circle" className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                  {errors.name && <p className="text-xs text-[#DC2626]">{errors.name}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0D1117]">Description</label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Optional. Describe the purpose of this group." className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none" />
                </div>
              </div>
            )}

            {/* Step 2 — Cycle setup */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Cycle setup</h1>
                  <p className="text-sm text-[#6B7280]">Configure how this group operates.</p>
                </div>

                <Alert type="info">
                  The number of rounds in a cycle equals the number of members. Each member receives one payout per cycle.
                </Alert>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#0D1117]">Maximum members <span className="text-[#DC2626]">*</span></label>
                    <input type="number" value={form.maxMembers} onChange={e => set('maxMembers', e.target.value)} placeholder="e.g. 12" min={2} max={50} className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                    {errors.maxMembers && <p className="text-xs text-[#DC2626]">{errors.maxMembers}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#0D1117]">Contribution amount (₦) <span className="text-[#DC2626]">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] font-semibold">₦</span>
                      <input value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="e.g. 20,000" className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                    </div>
                    {errors.amount && <p className="text-xs text-[#DC2626]">{errors.amount}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#0D1117]">Contribution frequency</label>
                    <select value={form.frequency} onChange={e => set('frequency', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1746A2]">
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#0D1117]">Cycle start date <span className="text-[#DC2626]">*</span></label>
                    <input type="date" value={form.cycleStart} onChange={e => set('cycleStart', e.target.value)} className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                    {errors.cycleStart && <p className="text-xs text-[#DC2626]">{errors.cycleStart}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#0D1117]">Payout position method</label>
                  {PAYOUT_METHODS.map(m => (
                    <label key={m} className="flex items-start gap-3 cursor-pointer py-2">
                      <input type="radio" name="payoutMethod" value={m} checked={form.payoutMethod === m} onChange={() => set('payoutMethod', m)} className="mt-0.5 accent-[#1746A2]" />
                      <span className="text-sm text-[#374151]">{m}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 — Rules */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Group rules</h1>
                  <p className="text-sm text-[#6B7280]">These rules are shown to all members and accepted at join time. You can edit them later.</p>
                </div>

                <div className="flex flex-col gap-2">
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex items-start gap-3 bg-white rounded-lg border border-[#E2E6F0] px-4 py-3">
                      <span className="text-xs font-bold text-[#9CA3AF] mt-0.5 shrink-0">{i + 1}.</span>
                      <p className="flex-1 text-sm text-[#374151]">{rule}</p>
                      <button type="button" onClick={() => removeRule(i)} className="text-[#9CA3AF] hover:text-[#DC2626] shrink-0 text-lg leading-none">×</button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input value={newRule} onChange={e => setNewRule(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRule() }}} placeholder="Add a rule…" className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]" />
                  <Button type="button" variant="secondary" size="sm" onClick={addRule}>Add</Button>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Review your group</h1>
                  <p className="text-sm text-[#6B7280]">Review the details before creating the group.</p>
                </div>

                <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#F1F3F8]">
                    <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-2xl">{form.emoji}</div>
                    <div>
                      <p className="text-base font-bold text-[#0D1117]">{form.name || '—'}</p>
                      {form.description && <p className="text-xs text-[#6B7280]">{form.description}</p>}
                    </div>
                  </div>
                  {[
                    { label: 'Max members', value: form.maxMembers || '—' },
                    { label: 'Contribution', value: form.amount ? `₦${form.amount}` : '—' },
                    { label: 'Frequency', value: form.frequency },
                    { label: 'Cycle start', value: form.cycleStart || '—' },
                    { label: 'Payout order', value: form.payoutMethod.split(' (')[0] },
                  ].map((r, i, arr) => (
                    <div key={i} className={`flex justify-between py-2.5 ${i < arr.length - 1 ? 'border-b border-[#F1F3F8]' : ''}`}>
                      <p className="text-sm text-[#6B7280]">{r.label}</p>
                      <p className="text-sm font-semibold text-[#0D1117]">{r.value}</p>
                    </div>
                  ))}
                </div>

                {form.rules.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Group rules</p>
                    <ol className="flex flex-col gap-2">
                      {form.rules.map((r, i) => (
                        <li key={i} className="text-sm text-[#374151] flex gap-2">
                          <span className="text-[#9CA3AF] shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E2E6F0]">
              <Button type="button" variant="secondary" onClick={back} disabled={step === 1}>← Back</Button>
              {step < 4
                ? <Button type="button" onClick={next}>Continue →</Button>
                : <Button type="submit" loading={submitting}>Create group</Button>}
            </div>
          </form>
        </div>
      </div>
    </OwnerShell>
  )
}
