import { useState } from 'react'
import { Logo, Button, Field, Input, Select, StepIndicator, Alert, Badge } from './ui'
import type { View, NavMeta } from '../App'

interface Props { navigate: (v: View, meta?: NavMeta) => void }

const STEPS = [
  { label: 'Basic profile', sublabel: 'Who you are' },
  { label: 'Home address', sublabel: 'Where you live' },
  { label: 'Identity verification', sublabel: 'NIN & documents' },
  { label: 'Bank information', sublabel: 'Payout details' },
  { label: 'Review & submit', sublabel: 'Final check' },
]

const NIGERIAN_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'GTBank', code: '058' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'UBA', code: '033' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'Union Bank', code: '032' },
  { name: 'Stanbic IBTC', code: '221' },
  { name: 'Ecobank', code: '050' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Kuda Bank', code: '090267' },
  { name: 'Opay', code: '100004' },
  { name: 'PalmPay', code: '100033' },
]

function calculateAge(dob: string) {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

// ── Step 1: Profile ───────────────────────────────────────────────────────────

function ProfileStep({ onNext }: { onNext: () => void }) {
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const age = calculateAge(dob)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!dob) e.dob = 'Date of birth is required'
    else if (age !== null && age < 18) e.dob = 'You must be at least 18 years old to participate'
    else if (age !== null && age > 100) e.dob = 'Please enter a valid date of birth'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    setErrors(errs)
    if (!Object.keys(errs).length) onNext()
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = ev => setPhoto(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="display-font text-xl font-bold text-[#0D1117] mb-1">Basic profile</h2>
        <p className="text-sm text-[#6B7280]">Tell us a bit about yourself. This information helps verify your identity.</p>
      </div>

      {/* Photo upload */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-[#F1F3F8] border-2 border-dashed border-[#C7D2FE] flex items-center justify-center overflow-hidden shrink-0">
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0D1117] mb-1">Profile photo <span className="text-[#9CA3AF] font-normal">(optional)</span></p>
          <p className="text-xs text-[#6B7280] mb-2">JPG or PNG, max 5MB. A clear face photo helps coordinators recognise you.</p>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#1746A2] text-xs font-semibold cursor-pointer hover:bg-[#E0E8FF] transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5a.75.75 0 01.75.75v5h5a.75.75 0 010 1.5h-5v5a.75.75 0 01-1.5 0v-5h-5a.75.75 0 010-1.5h5v-5A.75.75 0 018 1.5z" />
            </svg>
            Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>
      </div>

      <Field label="Date of birth" required error={errors.dob} hint="You must be 18 or older to participate in thrift groups">
        <Input
          type="date"
          value={dob}
          onChange={e => setDob(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          error={!!errors.dob}
        />
        {age !== null && age >= 18 && (
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF5] rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span className="text-xs font-semibold text-[#065F46]">Age: {age} years</span>
          </div>
        )}
      </Field>

      <Field label="Gender" hint="Optional — you may leave this blank">
        <Select value={gender} onChange={e => setGender(e.target.value)}>
          <option value="">Prefer not to say</option>
          <option>Male</option>
          <option>Female</option>
          <option>Non-binary</option>
        </Select>
      </Field>

      <Alert type="info">
        Your personal information is securely stored and never shared with third parties without your consent.
      </Alert>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">Save & continue →</Button>
      </div>
    </div>
  )
}

// ── Step 2: Address ───────────────────────────────────────────────────────────

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River',
  'Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano',
  'Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun',
  'Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
]

function AddressStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [form, setForm] = useState({ street: '', city: '', state: '', country: 'Nigeria' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.street) e.street = 'Street address is required'
    if (!form.city) e.city = 'City is required'
    if (!form.state) e.state = 'Please select your state'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    setErrors(errs)
    if (!Object.keys(errs).length) onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="display-font text-xl font-bold text-[#0D1117] mb-1">Residential address</h2>
        <p className="text-sm text-[#6B7280]">This should match the address on your government-issued ID or proof of address.</p>
      </div>

      <Field label="Street address" required error={errors.street} hint="Include house number, street name, and landmark if needed">
        <Input
          value={form.street}
          onChange={e => set('street', e.target.value)}
          placeholder="14B Bode Thomas Street, Surulere"
          error={!!errors.street}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City / LGA" required error={errors.city}>
          <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Lagos Island" error={!!errors.city} />
        </Field>
        <Field label="State" required error={errors.state}>
          <Select value={form.state} onChange={e => set('state', e.target.value)} error={!!errors.state}>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Country">
        <Input value={form.country} readOnly className="bg-[#F1F3F8] cursor-not-allowed" />
      </Field>

      <Alert type="info">
        Your address is used only for identity verification. It will not be shared with your thrift group members.
      </Alert>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} size="lg">Save & continue →</Button>
      </div>
    </div>
  )
}

// ── Step 3: Identity ──────────────────────────────────────────────────────────

function IdentityStep({ onNext, onBack, identityStatus }: { onNext: () => void; onBack: () => void; identityStatus: string }) {
  const [nin, setNin] = useState('')
  const [ninSlip, setNinSlip] = useState<string | null>(null)
  const [proofDoc, setProofDoc] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isRejected = identityStatus === 'rejected'

  const validate = () => {
    const e: Record<string, string> = {}
    if (!nin) e.nin = 'NIN is required'
    else if (!/^\d{11}$/.test(nin.replace(/\s/g, ''))) e.nin = 'NIN must be exactly 11 digits'
    if (!ninSlip) e.ninSlip = 'Please upload your NIN slip or card'
    if (!proofDoc) e.proofDoc = 'Please upload a proof of address document'
    return e
  }

  const handleFile = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setter(file.name)
  }

  const handleNext = () => {
    const errs = validate()
    setErrors(errs)
    if (!Object.keys(errs).length) onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="display-font text-xl font-bold text-[#0D1117] mb-1">Identity verification</h2>
        <p className="text-sm text-[#6B7280]">We use your NIN to confirm your identity. Your documents are reviewed securely by our compliance team.</p>
      </div>

      {isRejected && (
        <Alert type="error" title="Submission rejected">
          Your previous submission was rejected. Reason: <strong>NIN slip image was blurry and unreadable.</strong> Please upload clearer documents and resubmit.
        </Alert>
      )}

      <Field label="National Identification Number (NIN)" required error={errors.nin} hint="Your 11-digit NIN from NIMC">
        <Input
          value={nin}
          onChange={e => setNin(e.target.value.replace(/\D/g, '').slice(0, 11))}
          placeholder="12345678901"
          maxLength={11}
          error={!!errors.nin}
        />
      </Field>

      {/* NIN Slip upload */}
      <div>
        <p className="text-sm font-semibold text-[#0D1117] mb-1.5">
          NIN slip or card <span className="text-[#DC2626]">*</span>
        </p>
        <p className="text-xs text-[#6B7280] mb-2">Upload a clear photo or scan of your NIMC slip or NIN card. Accepted formats: JPG, PNG, PDF.</p>
        <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${ninSlip ? 'border-[#059669] bg-[#ECFDF5]' : errors.ninSlip ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#C7D2FE] bg-[#F8FAFF] hover:bg-[#EEF2FF]'}`}>
          {ninSlip ? (
            <>
              <svg className="w-8 h-8 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-sm font-semibold text-[#059669]">{ninSlip}</span>
              <span className="text-xs text-[#059669]">Uploaded successfully</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4M12 8v8" />
              </svg>
              <span className="text-sm font-semibold text-[#374151]">Click to upload NIN slip</span>
              <span className="text-xs text-[#9CA3AF]">or drag and drop here</span>
            </>
          )}
          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile(setNinSlip)} />
        </label>
        {errors.ninSlip && <p className="text-xs text-red-500 mt-1.5">{errors.ninSlip}</p>}
      </div>

      {/* Proof of address */}
      <div>
        <p className="text-sm font-semibold text-[#0D1117] mb-1.5">
          Proof of address <span className="text-[#DC2626]">*</span>
        </p>
        <p className="text-xs text-[#6B7280] mb-2">
          Upload a utility bill, bank statement, or tenancy agreement issued within the last 3 months showing your residential address.
        </p>
        <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${proofDoc ? 'border-[#059669] bg-[#ECFDF5]' : errors.proofDoc ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#C7D2FE] bg-[#F8FAFF] hover:bg-[#EEF2FF]'}`}>
          {proofDoc ? (
            <>
              <svg className="w-8 h-8 text-[#059669]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-sm font-semibold text-[#059669]">{proofDoc}</span>
              <span className="text-xs text-[#059669]">Uploaded successfully</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-[#9CA3AF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4-4 4M12 8v8" />
              </svg>
              <span className="text-sm font-semibold text-[#374151]">Click to upload proof of address</span>
              <span className="text-xs text-[#9CA3AF]">Utility bill, bank statement, or tenancy agreement</span>
            </>
          )}
          <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFile(setProofDoc)} />
        </label>
        {errors.proofDoc && <p className="text-xs text-red-500 mt-1.5">{errors.proofDoc}</p>}
      </div>

      <Alert type="info">
        Documents are reviewed within 1–2 business days. We'll notify you by email and SMS when your verification is complete.
      </Alert>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} size="lg">Save & continue →</Button>
      </div>
    </div>
  )
}

// ── Step 4: Bank ──────────────────────────────────────────────────────────────

function BankStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedBank = NIGERIAN_BANKS.find(b => b.code === bankCode)

  const resolveAccount = () => {
    if (!bankCode || accountNumber.length !== 10) return
    setResolving(true)
    setResolved(false)
    setResolvedName('')
    setTimeout(() => {
      setResolvedName('ADAEZE CHIDINMA OKONKWO')
      setResolving(false)
      setResolved(true)
    }, 1800)
  }

  const handleAccountChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 10)
    setAccountNumber(digits)
    setResolved(false)
    setResolvedName('')
    if (digits.length === 10 && bankCode) {
      resolveAccount()
    }
  }

  const handleBankChange = (code: string) => {
    setBankCode(code)
    setResolved(false)
    setResolvedName('')
    if (accountNumber.length === 10 && code) {
      setTimeout(() => resolveAccount(), 0)
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!bankCode) e.bank = 'Please select your bank'
    if (!accountNumber || accountNumber.length !== 10) e.account = 'Account number must be exactly 10 digits'
    if (!resolved) e.account = 'Please wait for your account name to be confirmed'
    return e
  }

  const handleNext = () => {
    const errs = validate()
    setErrors(errs)
    if (!Object.keys(errs).length) onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="display-font text-xl font-bold text-[#0D1117] mb-1">Bank & payout information</h2>
        <p className="text-sm text-[#6B7280]">This is where your thrift payouts will be sent. Make sure the account belongs to you.</p>
      </div>

      <Field label="Bank name" required error={errors.bank}>
        <Select value={bankCode} onChange={e => handleBankChange(e.target.value)} error={!!errors.bank}>
          <option value="">Select your bank</option>
          {NIGERIAN_BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
        </Select>
      </Field>

      <Field label="Account number" required error={errors.account} hint="Your 10-digit NUBAN account number">
        <Input
          value={accountNumber}
          onChange={e => handleAccountChange(e.target.value)}
          placeholder="0123456789"
          maxLength={10}
          inputMode="numeric"
          error={!!errors.account}
        />
      </Field>

      {/* Account name resolution */}
      {(resolving || resolved || resolvedName) && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 transition-all ${resolved ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#F1F3F8] border-[#E2E6F0]'}`}>
          {resolving ? (
            <>
              <svg className="animate-spin w-4 h-4 text-[#6B7280]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm text-[#6B7280]">Looking up account name…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-[#059669] shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              <div>
                <p className="text-xs text-[#6B7280]">Account name confirmed</p>
                <p className="text-sm font-bold text-[#065F46]">{resolvedName}</p>
              </div>
            </>
          )}
        </div>
      )}

      {resolved && (
        <Alert type="success" title="Account verified">
          Your account details have been confirmed. Payouts will be sent to {selectedBank?.name} — {resolvedName}.
        </Alert>
      )}

      <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] px-4 py-3">
        <p className="text-xs font-semibold text-[#92400E] mb-1">Important</p>
        <p className="text-xs text-[#92400E] leading-relaxed">
          The account you provide must be in your own name. Adding someone else's account may delay or prevent your payouts.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleNext} size="lg" disabled={!resolved}>
          {resolved ? 'Save & continue →' : 'Verify account first'}
        </Button>
      </div>
    </div>
  )
}

// ── Step 5: Review ────────────────────────────────────────────────────────────

function ReviewStep({ onSubmit, onBack }: { onSubmit: () => void; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  const items = [
    { label: 'Personal information', detail: 'Adaeze Chidinma Okonkwo · DOB: 14 Mar 1991 (34 yrs)', status: 'complete' },
    { label: 'Residential address', detail: '14B Bode Thomas Street, Surulere, Lagos', status: 'complete' },
    { label: 'Identity documents', detail: 'NIN slip + Proof of address uploaded', status: 'complete' },
    { label: 'Bank account', detail: 'GTBank — 0123456789 · ADAEZE CHIDINMA OKONKWO', status: 'complete' },
  ]

  const handleSubmit = () => {
    if (!agreed) return
    setLoading(true)
    setTimeout(() => { setLoading(false); onSubmit() }, 1800)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="display-font text-xl font-bold text-[#0D1117] mb-1">Review & submit</h2>
        <p className="text-sm text-[#6B7280]">Please review your information before submitting. You can go back to make changes.</p>
      </div>

      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFF] border border-[#E2E6F0]">
            <div>
              <p className="text-sm font-semibold text-[#0D1117]">{item.label}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{item.detail}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[#059669] shrink-0 ml-4">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
              </svg>
              <span className="text-xs font-semibold">Complete</span>
            </div>
          </div>
        ))}
      </div>

      <Alert type="info" title="What happens next?">
        Our compliance team will review your identity documents within 1–2 business days. You'll receive an email and SMS notification once your account is verified and eligible for thrift participation.
      </Alert>

      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-[#F8FAFF] border border-[#E2E6F0] hover:border-[#C7D2FE] transition-colors">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1746A2]" />
        <span className="text-sm text-[#374151] leading-relaxed">
          I confirm that all the information I've provided is accurate and truthful. I understand that providing false information may result in my account being suspended.
        </span>
      </label>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <Button onClick={handleSubmit} size="lg" loading={loading} disabled={!agreed}>
          Submit for review
        </Button>
      </div>
    </div>
  )
}

// ── Wizard shell ──────────────────────────────────────────────────────────────

export function OnboardingWizard({ navigate }: Props) {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])

  const next = () => {
    setCompleted(c => c.includes(step) ? c : [...c, step])
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else navigate('success')
  }

  const back = () => setStep(s => s - 1)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E2E6F0] px-6 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#6B7280] font-medium">Step {step + 1} of {STEPS.length}</span>
          <div className="w-32 h-1.5 bg-[#E2E6F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1746A2] rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-[#E2E6F0] px-6 py-8 gap-6">
          <div>
            <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Your progress</h3>
            <StepIndicator steps={STEPS} current={step} completed={completed} />
          </div>
          <div className="mt-auto p-4 rounded-xl bg-[#F1F3F8] border border-[#E2E6F0]">
            <p className="text-xs font-semibold text-[#0D1117] mb-1">Need help?</p>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              If you're unsure about any step, contact us at{' '}
              <span className="text-[#1746A2] font-medium">support@tcs.ng</span>
            </p>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center px-6 py-10">
          <div className="w-full max-w-xl">
            {/* Mobile step indicator */}
            <div className="lg:hidden mb-6 flex items-center gap-3 overflow-x-auto pb-2">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${completed.includes(i) ? 'bg-[#059669] text-white' : step === i ? 'bg-[#1746A2] text-white' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                    {completed.includes(i) ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-6 h-px bg-[#E2E6F0]" />}
                </div>
              ))}
            </div>

            {step === 0 && <ProfileStep onNext={next} />}
            {step === 1 && <AddressStep onNext={next} onBack={back} />}
            {step === 2 && <IdentityStep onNext={next} onBack={back} identityStatus="" />}
            {step === 3 && <BankStep onNext={next} onBack={back} />}
            {step === 4 && <ReviewStep onSubmit={next} onBack={back} />}
          </div>
        </main>
      </div>
    </div>
  )
}
