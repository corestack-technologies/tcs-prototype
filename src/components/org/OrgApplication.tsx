import { useState, useRef } from 'react'
import { Button, Alert } from '../ui'
import { AppShell } from '../thrift/AppShell'
import type { View, NavMeta } from '../../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const STEPS = [
  { number: 1, label: 'Organization details' },
  { number: 2, label: 'Operational info' },
  { number: 3, label: 'Why TCS' },
  { number: 4, label: 'Supporting docs' },
  { number: 5, label: 'Review & submit' },
]

const ORG_TYPES = ['Rotating Savings Group (Ajo / Esusu)', 'Investment & Savings Club', 'Staff Welfare & Savings Fund', 'Community Development Fund', 'Religious & Community Savings Group', 'Cooperative Savings Society', 'Other']
const FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly']
const PROCESSES = ['Spreadsheet (Excel / Google Sheets)', 'Paper ledger / notebook', 'WhatsApp group records', 'Cash tracking only', 'No formal system', 'Other']
const MEETING_SCHEDULES = ['Weekly in-person', 'Monthly in-person', 'Online only', 'Combination of in-person and online', 'No fixed meetings', 'Other']

interface FormData {
  name: string; tagline: string; description: string; orgType: string; location: string; logo: File | null
  estimatedMembers: string; frequency: string; avgAmount: string; existingProcess: string; communitiesServed: string; meetingSchedule: string
  whyDigitize: string; challenges: string; expectedBenefits: string
  existingRecords: File | null; photos: File[]; communityRefs: string; supportingDocs: File | null
  declarationAccepted: boolean
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[#0D1117]">
        {label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#9CA3AF]">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 4, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
      />
      {maxLength && <p className="absolute bottom-2 right-3 text-[10px] text-[#9CA3AF]">{value.length}/{maxLength}</p>}
    </div>
  )
}

function SelectInput({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function FileUpload({ label, accept, onChange, file }: { label: string; accept: string; onChange: (f: File | null) => void; file: File | null }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`w-full px-4 py-6 rounded-xl border-2 border-dashed text-center transition-colors ${file ? 'border-[#059669] bg-[#ECFDF5]' : 'border-[#E2E6F0] hover:border-[#1746A2] hover:bg-[#F8FAFF]'}`}
      >
        {file ? (
          <div>
            <p className="text-sm font-semibold text-[#059669]">✓ {file.name}</p>
            <p className="text-xs text-[#6B7280] mt-1">Click to replace</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-[#374151]">{label}</p>
            <p className="text-xs text-[#9CA3AF] mt-1">Click to browse · {accept.replace(/\./g, '').toUpperCase()}</p>
          </div>
        )}
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => onChange(e.target.files?.[0] ?? null)} />
    </div>
  )
}

export function OrgApplication({ navigate }: Props) {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '', tagline: '', description: '', orgType: '', location: '', logo: null,
    estimatedMembers: '', frequency: '', avgAmount: '', existingProcess: '', communitiesServed: '', meetingSchedule: '',
    whyDigitize: '', challenges: '', expectedBenefits: '',
    existingRecords: null, photos: [], communityRefs: '', supportingDocs: null,
    declarationAccepted: false,
  })

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(f => ({ ...f, [k]: v }))

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = 'Organization name is required.'
      if (!form.description.trim()) e.description = 'A brief description is required.'
      if (!form.orgType) e.orgType = 'Please select an organization type.'
      if (!form.location.trim()) e.location = 'Primary location is required.'
    }
    if (step === 2) {
      if (!form.estimatedMembers.trim()) e.estimatedMembers = 'Please estimate your current member count.'
      if (!form.frequency) e.frequency = 'Please select a contribution frequency.'
      if (!form.avgAmount.trim()) e.avgAmount = 'Please enter an average contribution amount.'
    }
    if (step === 3) {
      if (!form.whyDigitize.trim()) e.whyDigitize = 'This field is required.'
      if (!form.challenges.trim()) e.challenges = 'Please describe at least one challenge.'
    }
    if (step === 5) {
      if (!form.declarationAccepted) e.declarationAccepted = 'You must accept the declaration to submit.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 5)) }
  const back = () => { setErrors({}); setStep(s => Math.max(s - 1, 1)) }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      navigate('org-review', { mode: 'submitted' })
    }, 1800)
  }

  const reviewRow = (label: string, value: string) => (
    <div className="flex justify-between gap-4 py-3 border-b border-[#F1F3F8] last:border-0">
      <p className="text-sm text-[#6B7280] shrink-0">{label}</p>
      <p className="text-sm font-semibold text-[#0D1117] text-right">{value || '—'}</p>
    </div>
  )

  return (
    <AppShell navigate={navigate} activeView="dashboard">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate('org-opportunity')} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" /></svg>
          Organization opportunity
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">Application</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-7">
        <div className="max-w-2xl">

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              {STEPS.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s.number ? 'bg-[#1746A2] text-white' : step > s.number ? 'bg-[#059669] text-white' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                    {step > s.number ? '✓' : s.number}
                  </div>
                  {i < STEPS.length - 1 && <div className={`h-px flex-1 min-w-[20px] ${step > s.number ? 'bg-[#059669]' : 'bg-[#E2E6F0]'}`} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#9CA3AF]">Step {step} of {STEPS.length} — {STEPS[step - 1].label}</p>
          </div>

          <form onSubmit={submit}>

            {/* ── Step 1: Organization Details ─────────────────────────────── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Organization details</h1>
                  <p className="text-sm text-[#6B7280]">Tell us about the organization you want to create on TCS.</p>
                </div>

                <Field label="Organization name" required hint="This will be the public name of your TCS organization.">
                  <TextInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. Adaeze Thrift Network" />
                  {errors.name && <p className="text-xs text-[#DC2626]">{errors.name}</p>}
                </Field>

                <Field label="Tagline" hint="A short phrase that describes your organization. Max 100 characters.">
                  <TextInput value={form.tagline} onChange={v => set('tagline', v)} placeholder="e.g. Building wealth, one contribution at a time" maxLength={100} />
                </Field>

                <Field label="Description" required hint="Describe what your organization does and who it serves.">
                  <TextArea value={form.description} onChange={v => set('description', v)} placeholder="e.g. A trusted community savings group serving professionals and families across Lagos Island..." rows={4} maxLength={500} />
                  {errors.description && <p className="text-xs text-[#DC2626]">{errors.description}</p>}
                </Field>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Organization type" required hint="The type describes your organization, not your members.">
                    <SelectInput value={form.orgType} onChange={v => set('orgType', v)} options={ORG_TYPES} placeholder="Select type…" />
                    {errors.orgType && <p className="text-xs text-[#DC2626]">{errors.orgType}</p>}
                  </Field>
                  <Field label="Primary operating location" required hint="City, state or region.">
                    <TextInput value={form.location} onChange={v => set('location', v)} placeholder="e.g. Lagos Island, Lagos State" />
                    {errors.location && <p className="text-xs text-[#DC2626]">{errors.location}</p>}
                  </Field>
                </div>

                <Field label="Organization logo" hint="Optional. PNG or JPG, max 2MB. You can add this later.">
                  <FileUpload label="Upload your organization logo" accept=".png,.jpg,.jpeg" file={form.logo} onChange={f => set('logo', f)} />
                </Field>
              </div>
            )}

            {/* ── Step 2: Operational Information ──────────────────────────── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Operational information</h1>
                  <p className="text-sm text-[#6B7280]">Help us understand how your thrift operation currently runs.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Estimated active members" required hint="How many members are in your current group(s)?">
                    <TextInput value={form.estimatedMembers} onChange={v => set('estimatedMembers', v)} placeholder="e.g. 24" />
                    {errors.estimatedMembers && <p className="text-xs text-[#DC2626]">{errors.estimatedMembers}</p>}
                  </Field>
                  <Field label="Contribution frequency" required>
                    <SelectInput value={form.frequency} onChange={v => set('frequency', v)} options={FREQUENCIES} placeholder="Select frequency…" />
                    {errors.frequency && <p className="text-xs text-[#DC2626]">{errors.frequency}</p>}
                  </Field>
                </div>

                <Field label="Average contribution amount (₦)" required hint="The typical contribution amount per member per cycle.">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] font-semibold">₦</span>
                    <input
                      type="text"
                      value={form.avgAmount}
                      onChange={e => set('avgAmount', e.target.value)}
                      placeholder="e.g. 20,000"
                      className="w-full pl-8 pr-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                    />
                  </div>
                  {errors.avgAmount && <p className="text-xs text-[#DC2626]">{errors.avgAmount}</p>}
                </Field>

                <Field label="How do you currently manage records?">
                  <SelectInput value={form.existingProcess} onChange={v => set('existingProcess', v)} options={PROCESSES} placeholder="Select process…" />
                </Field>

                <Field label="Communities or areas served" hint="Describe the communities or neighborhoods your members come from.">
                  <TextArea value={form.communitiesServed} onChange={v => set('communitiesServed', v)} placeholder="e.g. Victoria Island, Ikoyi, and Lekki Phase 1. Mostly working professionals." rows={3} />
                </Field>

                <Field label="Meeting schedule" hint="Optional — how often do members meet?">
                  <SelectInput value={form.meetingSchedule} onChange={v => set('meetingSchedule', v)} options={MEETING_SCHEDULES} placeholder="Select schedule… (optional)" />
                </Field>
              </div>
            )}

            {/* ── Step 3: Why TCS ───────────────────────────────────────────── */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Why TCS?</h1>
                  <p className="text-sm text-[#6B7280]">Tell us about your motivation for digitizing your thrift organization.</p>
                </div>

                <Field label="Why do you want to digitize your thrift operations?" required hint="Max 500 characters.">
                  <TextArea value={form.whyDigitize} onChange={v => set('whyDigitize', v)} placeholder="e.g. I currently manage 24 members across two groups using WhatsApp and a spreadsheet. Record-keeping is time-consuming and members sometimes dispute whether they have paid..." rows={5} maxLength={500} />
                  {errors.whyDigitize && <p className="text-xs text-[#DC2626]">{errors.whyDigitize}</p>}
                </Field>

                <Field label="What are your biggest operational challenges today?" required hint="Max 400 characters.">
                  <TextArea value={form.challenges} onChange={v => set('challenges', v)} placeholder="e.g. Tracking who has paid each round, managing reminders, resolving disputes about payment dates..." rows={4} maxLength={400} />
                  {errors.challenges && <p className="text-xs text-[#DC2626]">{errors.challenges}</p>}
                </Field>

                <Field label="What do you hope to achieve with TCS?" hint="Max 400 characters.">
                  <TextArea value={form.expectedBenefits} onChange={v => set('expectedBenefits', v)} placeholder="e.g. Better transparency for members, less time spent on administration, a trustworthy record for all contributions and payouts..." rows={4} maxLength={400} />
                </Field>
              </div>
            )}

            {/* ── Step 4: Supporting Information ───────────────────────────── */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Supporting information</h1>
                  <p className="text-sm text-[#6B7280]">All fields on this page are optional. Supporting documents help us process your application faster.</p>
                </div>

                <Alert type="info">
                  You are not required to upload any documents. You can submit your application without attachments and provide documents later if requested.
                </Alert>

                <Field label="Existing contribution records" hint="A spreadsheet, PDF, or photo of your current records. Accepted: PDF, XLS, XLSX, PNG, JPG.">
                  <FileUpload label="Upload existing records" accept=".pdf,.xls,.xlsx,.png,.jpg,.jpeg" file={form.existingRecords} onChange={f => set('existingRecords', f)} />
                </Field>

                <Field label="Community references" hint="Names of TCS members or known community figures who can vouch for your thrift group.">
                  <TextArea value={form.communityRefs} onChange={v => set('communityRefs', v)} placeholder="e.g. Tunde Lawal (TCS member, Victoria Island group) — +234 802 345 6789" rows={3} />
                </Field>

                <Field label="Additional supporting documents" hint="Any other relevant documents. Accepted: PDF, PNG, JPG.">
                  <FileUpload label="Upload supporting documents" accept=".pdf,.png,.jpg,.jpeg" file={form.supportingDocs} onChange={f => set('supportingDocs', f)} />
                </Field>
              </div>
            )}

            {/* ── Step 5: Review & Submit ───────────────────────────────────── */}
            {step === 5 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h1 className="display-font text-xl font-bold text-[#0D1117] mb-0.5">Review & submit</h1>
                  <p className="text-sm text-[#6B7280]">Review your application before submitting. Use the Back button to make changes.</p>
                </div>

                {/* Summary blocks */}
                {[
                  {
                    title: 'Organization details',
                    rows: [
                      ['Name', form.name],
                      ['Tagline', form.tagline || 'Not provided'],
                      ['Type', form.orgType],
                      ['Location', form.location],
                      ['Logo', form.logo ? form.logo.name : 'Not uploaded'],
                    ],
                  },
                  {
                    title: 'Operational information',
                    rows: [
                      ['Estimated members', form.estimatedMembers],
                      ['Frequency', form.frequency],
                      ['Avg contribution', form.avgAmount ? `₦${form.avgAmount}` : '—'],
                      ['Current process', form.existingProcess || 'Not specified'],
                      ['Meeting schedule', form.meetingSchedule || 'Not specified'],
                    ],
                  },
                  {
                    title: 'Why TCS',
                    rows: [
                      ['Why digitize', form.whyDigitize ? form.whyDigitize.slice(0, 100) + (form.whyDigitize.length > 100 ? '…' : '') : '—'],
                      ['Challenges', form.challenges ? form.challenges.slice(0, 100) + (form.challenges.length > 100 ? '…' : '') : '—'],
                    ],
                  },
                  {
                    title: 'Supporting information',
                    rows: [
                      ['Records', form.existingRecords?.name ?? 'Not uploaded'],
                      ['Community refs', form.communityRefs ? 'Provided' : 'Not provided'],
                      ['Supporting docs', form.supportingDocs?.name ?? 'Not uploaded'],
                    ],
                  },
                ].map(section => (
                  <div key={section.title} className="bg-white rounded-xl border border-[#E2E6F0] p-5">
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">{section.title}</p>
                    {section.rows.map(([label, value]) => reviewRow(label, value))}
                  </div>
                ))}

                {/* Declaration */}
                <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] p-5">
                  <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">Declaration</p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.declarationAccepted}
                      onChange={e => set('declarationAccepted', e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-[#E2E6F0] accent-[#1746A2] shrink-0"
                    />
                    <span className="text-sm text-[#374151] leading-relaxed">
                      I confirm that the information provided in this application is accurate and truthful. I understand that TCS reserves the right to verify the information provided and to decline or revoke approval if any information is found to be inaccurate.
                    </span>
                  </label>
                  {errors.declarationAccepted && <p className="text-xs text-[#DC2626] mt-2">{errors.declarationAccepted}</p>}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#E2E6F0]">
              <Button type="button" variant="secondary" onClick={back} disabled={step === 1}>
                ← Back
              </Button>
              {step < 5 ? (
                <Button type="button" onClick={next}>
                  Continue →
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  Submit application
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
