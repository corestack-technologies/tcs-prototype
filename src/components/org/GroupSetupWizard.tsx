import { OwnerProgress } from '../../organizations/OwnerProgress'
import {schedules} from '../../rounds/schedule'
import {
  useState,
  useMemo,
  createContext,
  useContext,
  Children,
  isValidElement,
  cloneElement,
  type ReactElement,
} from "react"
import { Button, Alert } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useDraftGroup } from "../../groups/GroupContext"
import {
  configurationErrors,
  BASE_RULES,
  type Draft,
  type Frequency,
  type Visibility,
  type FeeType,
} from "../../groups/model"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
}

const STEPS = [
  { n: 1, label: "Group basics" },
  { n: 2, label: "Contribution setup" },
  { n: 3, label: "Position rules" },
  { n: 4, label: "Financial policies" },
  { n: 5, label: "Group rules" },
  { n: 6, label: "Review & save" },
]

// ── Date helpers ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₦${n.toLocaleString()}`
}

function cycleDurationLabel(frequency: Frequency, positions: number): string {
  switch (frequency) {
    case "Daily":
      return `${positions} day${positions !== 1 ? "s" : ""}`
    case "Weekly":
      return `${positions} week${positions !== 1 ? "s" : ""}`
    case "Biweekly":
      return `${positions * 2} weeks`
    case "Monthly":
      return `${positions} month${positions !== 1 ? "s" : ""}`
  }
}

// ── Calculator ────────────────────────────────────────────────────────────────

function useCalc(f: Draft) {
  return useMemo(() => {
    const gross = f.amount * f.positions
    const payoutPerFullPosition = gross
    const maxEquivPerMember =
      f.multiplePositions === "unlimited"
        ? f.positions
        : f.multiplePositions === "max"
          ? f.maxPerMember
          : 1
    const effectiveSplit = f.allowSplit
    const parts = effectiveSplit ? f.splitParts : 1
    const partLabel =
      parts === 2 ? "Shared Position (2 participants)" : "Individual Position"
    const contribPerPart = f.amount / parts
    const payoutPerPart = payoutPerFullPosition / parts
    const minParticipants = Math.ceil(f.positions / maxEquivPerMember)
    const maxParticipants = effectiveSplit ? f.positions * parts : f.positions
    const cycleDuration = cycleDurationLabel(f.frequency, f.positions)

    // Fee
    const feeAmount = f.feeEnabled
      ? f.feeType === "flat"
        ? f.feeValue
        : Math.round((gross * f.feeValue) / 100)
      : 0
    const netPayout = gross - feeAmount

    // Calendar schedule
    let contributionOpenDate = "—"
    let normalDeadline = "—"
    let gracePeriodEnd = "—"
    let defaultStart = "—"
    let earliestPayoutReady = "—"
    let finalCycleDate = "—"

    if (f.startDate) {
      try {
        const plan=schedules(f),first=plan[0],last=plan[plan.length-1]
        const format=(at:string)=>new Intl.DateTimeFormat('en-GB',{timeZone:f.timezone,dateStyle:'medium',timeStyle:'short'}).format(new Date(at))
        contributionOpenDate=format(first.opensAt)
        normalDeadline=format(first.dueAt)
        gracePeriodEnd=f.frequency==='Daily'||!f.gracePeriodDays?'No grace':format(new Date(Date.parse(first.lateAt)-1).toISOString())
        defaultStart=format(first.lateAt)
        earliestPayoutReady=format(first.payoutTargetAt)+' or earlier where ready'
        finalCycleDate=format(last.periodEnd)
      } catch { /* An incomplete draft has no valid schedule preview yet. */ }
    }

    return {
      gross,
      payoutPerFullPosition,
      cycleDuration,
      parts,
      partLabel,
      contribPerPart,
      payoutPerPart,
      minParticipants,
      maxParticipants,
      feeAmount,
      netPayout,
      contributionOpenDate,
      normalDeadline,
      gracePeriodEnd,
      defaultStart,
      earliestPayoutReady,
      finalCycleDate,
    }
  }, [f])
}

// ── Sub-components ────────────────────────────────────────────────────────────

const FieldId = createContext<string | undefined>(undefined)
function NumberInput({
  value,
  onChange,
  min = 1,
  max = 9999,
  step = 1,
  prefix,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
}) {
  return (
    <div className="flex items-center border border-[#E2E6F0] rounded-[10px] overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1746A2]">
      {prefix && (
        <span className="px-3 py-2.5 text-sm text-[#6B7280] bg-[#F8FAFF] border-r border-[#E2E6F0]">
          {prefix}
        </span>
      )}
      <input
        aria-label={useContext(FieldId)}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) =>
          onChange(Math.min(max, Math.max(min, Number(e.target.value))))
        }
        className="flex-1 px-3.5 py-2.5 text-sm text-[#0D1117] focus:outline-none"
      />
    </div>
  )
}

function Toggle({
  value,
  onToggle,
  label,
  desc,
}: {
  value: boolean
  onToggle: () => void
  label: string
  desc?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-[#E2E6F0] hover:border-[#C7D2FE] transition-colors bg-white"
    >
      <div className="text-left">
        <p className="text-sm font-semibold text-[#0D1117]">{label}</p>
        {desc && (
          <p className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
            {desc}
          </p>
        )}
      </div>
      <div
        className={`relative inline-flex h-5 w-9 items-center rounded-full shrink-0 transition-colors ${
          value ? "bg-[#1746A2]" : "bg-[#E2E6F0]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-4" : "translate-x-1"
          }`}
        />
      </div>
    </button>
  )
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <FieldId.Provider value={label}>
      <fieldset className="flex flex-col gap-1.5 min-w-0">
        <legend className="text-sm font-semibold text-[#0D1117]">
          {label}
          {required && <span className="text-[#DC2626] ml-0.5">*</span>}
        </legend>
        {Children.map(children, (child) =>
          isValidElement(child) &&
          ["input", "textarea", "select"].includes(String(child.type))
            ? cloneElement(child as ReactElement<{ "aria-label"?: string }>, {
                "aria-label": label,
              })
            : child,
        )}
        {hint && (
          <p className="text-xs text-[#9CA3AF] leading-relaxed">{hint}</p>
        )}
      </fieldset>
    </FieldId.Provider>
  )
}

function FeeTypeToggle({
  value,
  onChange,
}: {
  value: FeeType
  onChange: (v: FeeType) => void
}) {
  return (
    <div className="flex gap-2">
      {(["percentage", "flat"] as FeeType[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 transition-colors ${
            value === t
              ? "border-[#1746A2] bg-[#EEF2FF] text-[#1746A2]"
              : "border-[#E2E6F0] text-[#6B7280] hover:border-[#C7D2FE]"
          }`}
        >
          {t === "percentage" ? "Percentage (%)" : "Flat amount (₦)"}
        </button>
      ))}
    </div>
  )
}

function CalcPanel({ f, calc }: { f: Draft ; calc: ReturnType<typeof useCalc> }) {
  const ready = f.amount > 0 && f.positions > 0
  const effectiveSplit = f.allowSplit

  const scheduleRows = [
    { label: "Contribution opening", value: calc.contributionOpenDate },
    { label: "Normal deadline", value: calc.normalDeadline },
    ...(f.frequency !== "Daily"
      ? [
          { label: "Grace period ends", value: calc.gracePeriodEnd },
          { label: "Default begins", value: calc.defaultStart },
        ]
      : []),
    { label: "Earliest payout readiness", value: calc.earliestPayoutReady },
    { label: "Estimated cycle end", value: calc.finalCycleDate },
  ]

  const rows = [
    {
      label: "Frequency",
      value:
        f.frequency === "Biweekly" ? "Bi-weekly (every 14 days)" : f.frequency,
      bold: false,
    },
    {
      label: "Contribution per participant",
      value: ready ? fmt(calc.contribPerPart) : "—",
      bold: true,
    },
    {
      label: "Payout positions",
      value: f.positions ? `${f.positions}` : "—",
      bold: false,
    },
    {
      label: "Gross collection per period",
      value: ready ? fmt(calc.gross) : "—",
      bold: true,
    },
    {
      label: "Scheduled Payout Value per full position",
      value: ready ? fmt(calc.payoutPerFullPosition) : "—",
      bold: true,
    },
    ...(f.feeEnabled && ready
      ? [
          {
            label: `Group fee${
              f.feeType === "percentage" ? ` (${f.feeValue}%)` : ""
            }`,
            value: `– ${fmt(calc.feeAmount)}`,
            bold: false,
          },
          {
            label: "Illustrative payout after Organization fee",
            value: fmt(calc.netPayout),
            bold: true,
          },
        ]
      : []),
    ...(effectiveSplit
      ? [
          {
            label: "Maximum participants per position",
            value: `${calc.parts}`,
            bold: false,
          },
          {
            label: "Contribution per participant",
            value: ready ? fmt(calc.contribPerPart) : "—",
            bold: false,
          },
          {
            label: "Expected payout per participant",
            value: ready ? fmt(calc.payoutPerPart) : "—",
            bold: false,
          },
        ]
      : []),
    {
      label: "Min. participants",
      value: f.positions ? `${calc.minParticipants}` : "—",
      bold: false,
    },
    {
      label: "Max. participants",
      value: f.positions ? `${calc.maxParticipants}` : "—",
      bold: false,
    },
    {
      label: "Cycle duration",
      value: f.positions ? calc.cycleDuration : "—",
      bold: false,
    },
  ]

  return (
    <div className="bg-[#0D1117] rounded-2xl p-5 sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
        <p className="text-xs font-bold text-white uppercase tracking-widest">
          Live calculator
        </p>
      </div>
      <div className="flex flex-col gap-0 divide-y divide-white/10">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-start justify-between py-2.5 gap-3"
          >
            <p className="text-xs text-white/50 leading-relaxed">{r.label}</p>
            <p
              className={`text-sm text-right shrink-0 ${
                r.bold ? "font-bold text-[#34D399]" : "font-medium text-white"
              }`}
            >
              {r.value}
            </p>
          </div>
        ))}
      </div>

      {/* Schedule */}
      {f.startDate && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wide mb-2">
            Schedule
          </p>
          <div className="flex flex-col gap-0 divide-y divide-white/10">
            {scheduleRows.map((r) => (
              <div
                key={r.label}
                className="flex items-start justify-between py-2 gap-2"
              >
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {r.label}
                </p>
                <p className="text-[10px] text-white/70 font-medium text-right shrink-0">
                  {r.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-white/30 mt-3 leading-relaxed">
            Illustrative planning only; no Rounds, obligations or payouts are
            generated. Own-Round contributions are optional; actual payout
            depends on later financial readiness.
          </p>
        </div>
      )}

      {/* Example outcomes */}
      {ready && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wide">
            Example outcomes
          </p>
          <div className="bg-white/5 rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-white/40 mb-0.5">
              Individual Position
            </p>
            <p className="text-xs text-white">
              Pay {fmt(f.amount)}/period · receive{" "}
              {f.feeEnabled
                ? fmt(calc.netPayout)
                : fmt(calc.payoutPerFullPosition)}{" "}
              net
            </p>
          </div>
          {effectiveSplit && (
            <div className="bg-white/5 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-white/40 mb-0.5">
                {calc.partLabel}
              </p>
              <p className="text-xs text-white">
                Pay {fmt(calc.contribPerPart)}/period · receive{" "}
                {fmt(calc.payoutPerPart)} gross
              </p>
            </div>
          )}
          {f.multiplePositions !== "none" && (
            <div className="bg-white/5 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-white/40 mb-0.5">
                2 Individual Positions
              </p>
              <p className="text-xs text-white">
                Pay {fmt(f.amount * 2)}/period · two payout entitlements
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function GroupSetupWizard({ navigate }: Props) {
  const [step, setStep] = useState(1)
  const { cycle, act, boundary } = useDraftGroup()
  const form = cycle.terms
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [saved, setSaved] = useState(false)

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    act({ type: "terms", terms: { ...form, [k]: v } })
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const setFrequency = (freq: Frequency) => {
    act({
      type: "terms",
      terms: {
        ...form,
        frequency: freq,
        contributionWindowDays: freq === "Biweekly" ? 14 : 7,
        gracePeriodDays: freq === "Daily" ? 0 : freq === "Weekly" ? 1 : 2,
      },
    })
  }

  const calc = useCalc(form)

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (step === 1) {
      if (!form.name.trim()) e.name = "Group name is required."
    }
    if (step === 2) {
      if (!form.amount || form.amount <= 0)
        e.amount = "Contribution must be positive."
      if (!form.positions || form.positions < 2)
        e.positions = "At least 2 positions required."
      if (!form.startDate) e.startDate = "Start date is required."
      if (form.frequency !== "Daily" && form.feeEnabled && form.feeValue <= 0)
        e.feeValue = "Fee value must be greater than zero."
    }
    if (step === 4) {
      if (form.feeEnabled && form.feeValue <= 0)
        e.feeValue = "Fee value must be greater than zero."
      if (!Number.isInteger(form.dailyPenaltyRateBps ?? 0) || (form.dailyPenaltyRateBps ?? 0) < 0 || (form.dailyPenaltyRateBps ?? 0) > 10)
        e.dailyPenaltyRateBps = "Use an integer daily rate from 0 to 10 bps."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (validate()) setStep((s) => Math.min(6, s + 1))
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  const saveDraft = () => {
    const problems = configurationErrors(form, boundary)
    if (problems.length) {
      setErrors({ summary: problems.join(" ") })
      return
    }
    setSaved(true)
    navigate("owner-group-recruit")
  }

  const visibilityOpts: { value: Visibility ; label: string ; desc: string }[] = [
    {
      value: "Private",
      label: "Private",
      desc: "Unlisted Group; the Organization recruits Members privately.",
    },
    {
      value: "Invite Only",
      label: "Invite only",
      desc: "Joining requires a direct Organization invitation.",
    },
    {
      value: "Public",
      label: "Public / Discoverable",
      desc: "Verified Members can discover and request to join.",
    },
  ]

  const freqOpts: { value: Frequency ; label: string ; hint: string }[] = [
    {
      value: "Daily",
      label: "Daily",
      hint: "One contribution period per calendar day.",
    },
    {
      value: "Weekly",
      label: "Weekly",
      hint: "One contribution period every 7 days.",
    },
    {
      value: "Biweekly",
      label: "Bi-weekly",
      hint: "One contribution period every 14 days.",
    },
    {
      value: "Monthly",
      label: "Monthly",
      hint: "One contribution period per calendar month.",
    },
  ]

  const maxWindowDays =
    form.frequency === "Weekly" ? 7 : form.frequency === "Biweekly" ? 14 : 30

  return (
    <OwnerShell navigate={navigate} activeView="owner-groups"><OwnerProgress current={0}/>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E6F0] px-6 lg:px-8 py-3.5 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("owner-groups")}
          className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#0D1117] font-medium"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M9.78 11.78a.75.75 0 01-1.06 0L4.47 7.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L6.06 7l3.72 3.72a.75.75 0 010 1.06z" />
          </svg>
          My Groups
        </button>
        <span className="text-[#E2E6F0]">/</span>
        <span className="text-sm font-semibold text-[#0D1117]">
          Group setup · Cycle 1
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          {errors.summary && <Alert type="warning">{errors.summary}</Alert>}
          {/* Step progress */}
          <div className="mb-7">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div
                  aria-current={s.n === step ? "step" : undefined}
                  key={s.n}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        s.n < step
                          ? "bg-[#059669] text-white"
                          : s.n === step
                            ? "bg-[#1746A2] text-white"
                            : "bg-[#F1F3F8] text-[#9CA3AF]"
                      }`}
                    >
                      {s.n < step ? (
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                        </svg>
                      ) : (
                        s.n
                      )}
                    </div>
                    <p
                      className={`text-[10px] font-semibold whitespace-nowrap hidden sm:block ${
                        s.n === step
                          ? "text-[#1746A2]"
                          : s.n < step
                            ? "text-[#059669]"
                            : "text-[#9CA3AF]"
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        i < step - 1 ? "bg-[#059669]" : "bg-[#E2E6F0]"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {saved && (
            <Alert type="success" className="mb-5">
              Draft saved! Moving to recruitment…
            </Alert>
          )}

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
            {/* Form area */}
            <div className="bg-white rounded-2xl border border-[#E2E6F0] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#F1F3F8]">
                <p className="display-font text-lg font-bold text-[#0D1117]">
                  {STEPS[step - 1].label}
                </p>
                <p className="text-sm text-[#9CA3AF] mt-0.5">
                  Step {step} of {STEPS.length}
                </p>
              </div>

              <div className="px-6 py-6 flex flex-col gap-5">
                {/* ── Step 1: Group basics ── */}
                {step === 1 && (
                  <>
                    <Field label="Group name" required>
                      <input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="e.g. Victoria Island Monthly Ajo"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                      />
                      {errors.name && (
                        <p className="text-xs text-[#DC2626]">{errors.name}</p>
                      )}
                    </Field>
                    <Field
                      label="Description"
                      hint="Help potential members understand what this group is about."
                    >
                      <textarea
                        value={form.description}
                        onChange={(e) => set("description", e.target.value)}
                        rows={3}
                        placeholder="Describe the group's purpose, community, and culture…"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
                      />
                    </Field>
                    <Field label="Currency">
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F8FAFF] border border-[#E2E6F0] rounded-[10px]">
                        <span className="text-lg">🇳🇬</span>
                        <span className="text-sm font-semibold text-[#0D1117]">
                          Nigerian Naira (NGN)
                        </span>
                        <span className="ml-auto text-xs text-[#9CA3AF]">
                          Only currency supported in MVP
                        </span>
                      </div>
                    </Field>
                    <Field
                      label="Group visibility"
                      hint="You can change this at any time before the cycle launches."
                    >
                      <div className="grid sm:grid-cols-2 gap-2">
                        {visibilityOpts.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set("visibility", opt.value)}
                            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                              form.visibility === opt.value
                                ? "border-[#1746A2] bg-[#EEF2FF]"
                                : "border-[#E2E6F0] hover:border-[#C7D2FE]"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                form.visibility === opt.value
                                  ? "text-[#1746A2]"
                                  : "text-[#0D1117]"
                              }`}
                            >
                              {opt.label}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">
                              {opt.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </>
                )}

                {/* ── Step 2: Contribution setup ── */}
                {step === 2 && (
                  <>
                    <Field
                      label="Contribution amount per position"
                      required
                      hint="The amount each full payout position pays per period."
                    >
                      <NumberInput
                        value={form.amount}
                        onChange={(v) => set("amount", v)}
                        min={1}
                        max={10000000}
                        step={1000}
                        prefix="₦"
                      />
                      {errors.amount && (
                        <p className="text-xs text-[#DC2626]">
                          {errors.amount}
                        </p>
                      )}
                    </Field>

                    <Field label="Contribution frequency" required>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {freqOpts.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFrequency(opt.value)}
                            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                              form.frequency === opt.value
                                ? "border-[#1746A2] bg-[#EEF2FF]"
                                : "border-[#E2E6F0] hover:border-[#C7D2FE]"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                form.frequency === opt.value
                                  ? "text-[#1746A2]"
                                  : "text-[#0D1117]"
                              }`}
                            >
                              {opt.label}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">
                              {opt.hint}
                            </p>
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field
                      label="Number of payout positions"
                      required
                      hint="Each position receives one payout during the cycle. This also sets the number of periods."
                    >
                      <NumberInput
                        value={form.positions}
                        onChange={(v) => set("positions", v)}
                        min={2}
                        max={100}
                      />
                      {errors.positions && (
                        <p className="text-xs text-[#DC2626]">
                          {errors.positions}
                        </p>
                      )}
                    </Field>

                    <Field
                      label="Cycle start date"
                      required
                      hint="The date the first contribution period opens."
                    >
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                      />
                      {errors.startDate && (
                        <p className="text-xs text-[#DC2626]">
                          {errors.startDate}
                        </p>
                      )}
                    </Field>

                    {/* Monthly schedule */}
                    {form.frequency === "Monthly" && (
                      <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-5 py-4 flex flex-col gap-4">
                        <p className="text-sm font-bold text-[#0D1117]">
                          Monthly contribution schedule
                        </p>
                        <Field
                          label="Contributions open on day"
                          hint="The day of each calendar month from which members may contribute. Must be 28 or earlier to apply every month."
                        >
                          <div className="flex items-center gap-3">
                            <NumberInput
                              value={form.contributionOpenDay}
                              onChange={(v) => set("contributionOpenDay", v)}
                              min={1}
                              max={28}
                            />
                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                              of each month
                            </span>
                          </div>
                        </Field>
                        <div className="bg-white rounded-lg border border-[#E2E6F0] px-4 py-3 text-xs text-[#374151]">
                          <p className="font-semibold text-[#0D1117] mb-1">
                            Normal deadline
                          </p>
                          <p className="text-[#6B7280]">
                            The last calendar day of each month — correctly
                            adjusted for months with 28, 29, 30 or 31 days.
                            Contributions received after this deadline enter the
                            grace period.
                          </p>
                        </div>
                        <Field
                          label="Grace period"
                          hint="Days after the last calendar day before the default charge may apply. Contribution remains outstanding but no action is taken during grace."
                        >
                          <div className="flex items-center gap-3">
                            <NumberInput
                              value={form.gracePeriodDays}
                              onChange={(v) => set("gracePeriodDays", v)}
                              min={1}
                              max={14}
                            />
                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                              days after month-end
                            </span>
                          </div>
                        </Field>
                        <Field label="Time zone">
                          <select
                            value={form.timezone}
                            onChange={(e) => set("timezone", e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                          >
                            <option value="Africa/Lagos">
                              Africa/Lagos — West Africa Time (WAT, UTC+1)
                            </option>
                            <option value="Africa/Accra">
                              Africa/Accra — Greenwich Mean Time (GMT, UTC+0)
                            </option>
                            <option value="Africa/Nairobi">
                              Africa/Nairobi — East Africa Time (EAT, UTC+3)
                            </option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {/* Weekly / Bi-weekly schedule */}
                    {(form.frequency === "Weekly" ||
                      form.frequency === "Biweekly") && (
                      <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-5 py-4 flex flex-col gap-4">
                        <p className="text-sm font-bold text-[#0D1117]">
                          {form.frequency === "Biweekly"
                            ? "Bi-weekly"
                            : "Weekly"}{" "}
                          contribution schedule
                        </p>
                        <Field
                          label="Contribution window"
                          hint={`Days from the start of each period in which members may contribute.`}
                        >
                          <div className="flex items-center gap-3">
                            <NumberInput
                              value={form.contributionWindowDays}
                              onChange={(v) => set("contributionWindowDays", v)}
                              min={1}
                              max={maxWindowDays}
                            />
                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                              days per period
                            </span>
                          </div>
                        </Field>
                        <Field
                          label="Grace period"
                          hint="Days after the contribution window closes before the default charge may apply."
                        >
                          <div className="flex items-center gap-3">
                            <NumberInput
                              value={form.gracePeriodDays}
                              onChange={(v) => set("gracePeriodDays", v)}
                              min={1}
                              max={7}
                            />
                            <span className="text-sm text-[#6B7280] whitespace-nowrap">
                              days after deadline
                            </span>
                          </div>
                        </Field>
                        <Field label="Time zone">
                          <select
                            value={form.timezone}
                            onChange={(e) => set("timezone", e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1746A2]"
                          >
                            <option value="Africa/Lagos">
                              Africa/Lagos — WAT (UTC+1)
                            </option>
                            <option value="Africa/Accra">
                              Africa/Accra — GMT (UTC+0)
                            </option>
                            <option value="Africa/Nairobi">
                              Africa/Nairobi — EAT (UTC+3)
                            </option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {/* Daily schedule note */}
                    {form.frequency === "Daily" && (
                      <div className="bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-4 py-3 text-sm text-[#374151]">
                        <p className="font-semibold text-[#1746A2] mb-1">
                          Daily group schedule
                        </p>
                        Contributions are expected on the day each period opens.
                        No configurable collection window applies. Each calendar
                        day is one contribution period.
                      </div>
                    )}
                  </>
                )}

                {/* ── Step 3: Position rules ── */}
                {step === 3 && (
                  <>
                    <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-3 text-sm text-[#374151] leading-relaxed">
                      <p className="font-semibold text-[#0D1117] mb-1">
                        Member commitment rules
                      </p>
                      Group capacity is based on payout positions, not people.
                      Draft changes recalculate readiness and require affected
                      Members to reconfirm; activation protects the agreed
                      terms.
                    </div>

                    {true && (
                      <>
                        <Toggle
                          value={form.allowSplit}
                          onToggle={() => set("allowSplit", !form.allowSplit)}
                          label="Allow positions to be shared between participants"
                          desc="One full payout position can be shared by multiple participants, each contributing proportionally and receiving a matching share of the payout."
                        />
                        {form.allowSplit && (
                          <div className="ml-4 border-l-2 border-[#C7D2FE] pl-4 flex flex-col gap-3">
                            <Field
                              label="Maximum participants per shared position"
                              hint="All participants in a shared position contribute and receive payouts proportionally. Only two half-position holders are supported."
                            >
                              <div className="flex gap-2">
                                {[
                                  {
                                    n: 2,
                                    label: "2 participants (halves only)",
                                  },
                                ].map((opt) => (
                                  <button
                                    key={opt.n}
                                    type="button"
                                    onClick={() => set("splitParts", opt.n)}
                                    className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl border-2 transition-colors ${
                                      form.splitParts === opt.n
                                        ? "border-[#1746A2] bg-[#EEF2FF] text-[#1746A2]"
                                        : "border-[#E2E6F0] text-[#6B7280] hover:border-[#C7D2FE]"
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </Field>
                            {form.amount > 0 && form.positions > 0 && (
                              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg px-3 py-3 text-xs text-[#92400E] leading-relaxed flex flex-col gap-1.5">
                                <p className="font-semibold">
                                  Example with {form.splitParts} participants
                                  sharing one position:
                                </p>
                                <p>
                                  · Individual Position: pay {fmt(form.amount)}
                                  /period → receive{" "}
                                  {fmt(form.amount * form.positions)}
                                </p>
                                <p>
                                  · Shared Position ({form.splitParts}{" "}
                                  participants): pay{" "}
                                  {fmt(form.amount / form.splitParts)}/period →
                                  receive{" "}
                                  {fmt(
                                    (form.amount * form.positions) /
                                      form.splitParts,
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <Field
                      label="Multiple positions per member"
                      hint="Whether one member can hold more than one payout position."
                    >
                      <div className="flex flex-col gap-2">
                        {[
                          {
                            value: "none" as const,
                            label: "Not allowed",
                            desc: "Each Member may hold at most one equivalent position (full or half).",
                          },
                          {
                            value: "max" as const,
                            label: "Allowed up to a maximum",
                            desc: "One member can hold multiple positions, up to a limit you set.",
                          },
                          {
                            value: "unlimited" as const,
                            label: "Allowed with no fixed maximum",
                            desc: "One member may hold any number of positions, subject to remaining capacity.",
                          },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => set("multiplePositions", opt.value)}
                            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
                              form.multiplePositions === opt.value
                                ? "border-[#1746A2] bg-[#EEF2FF]"
                                : "border-[#E2E6F0] hover:border-[#C7D2FE]"
                            }`}
                          >
                            <p
                              className={`text-sm font-semibold ${
                                form.multiplePositions === opt.value
                                  ? "text-[#1746A2]"
                                  : "text-[#0D1117]"
                              }`}
                            >
                              {opt.label}
                            </p>
                            <p className="text-xs text-[#9CA3AF] mt-0.5">
                              {opt.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </Field>

                    {form.multiplePositions === "max" && (
                      <div className="ml-4 border-l-2 border-[#C7D2FE] pl-4">
                        <Field label="Maximum positions per member">
                          <NumberInput
                            value={form.maxPerMember}
                            onChange={(v) => set("maxPerMember", v)}
                            min={1}
                            max={form.positions}
                            step={form.allowSplit ? 0.5 : 1}
                          />
                          <div className="flex gap-2">
                            {[2, 3, 4, 5]
                              .filter((n) => n <= form.positions)
                              .map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => set("maxPerMember", n)}
                                  className={`w-14 py-2.5 text-sm font-bold rounded-xl border-2 transition-colors ${
                                    form.maxPerMember === n
                                      ? "border-[#1746A2] bg-[#EEF2FF] text-[#1746A2]"
                                      : "border-[#E2E6F0] text-[#6B7280] hover:border-[#C7D2FE]"
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                          </div>
                        </Field>
                      </div>
                    )}

                    <Field
                      label="Notes to members"
                      hint="Optional message shown to all members before they join."
                    >
                      <textarea
                        value={form.notesToMembers}
                        onChange={(e) => set("notesToMembers", e.target.value)}
                        rows={3}
                        placeholder="e.g. Please review your proposed payout position before accepting."
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none"
                      />
                    </Field>
                  </>
                )}

                {/* ── Step 4: Financial policies ── */}
                {step === 4 && (
                  <>
                    <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-3 text-sm text-[#374151] leading-relaxed">
                      <p className="font-semibold text-[#0D1117] mb-1">
                        Financial policies
                      </p>
                      These policies are disclosed before Member acceptance. Fee
                      calculations below are illustrative and use Scheduled
                      Payout Value; actual payout may differ when the recipient
                      skips their optional own-Round contribution.
                    </div>

                    {/* Group fee */}
                    <div className="flex flex-col gap-3 border border-[#E2E6F0] rounded-xl overflow-hidden">
                      <div className="px-5 pt-4 pb-0">
                        <p className="text-sm font-semibold pb-4">
                          Organization fee · required before activation. Applied
                          at payout using Scheduled Payout Value.
                        </p>
                      </div>
                      {form.feeEnabled && (
                        <div className="px-5 pb-5 flex flex-col gap-3 border-t border-[#F1F3F8] pt-4 mt-0">
                          <Field label="Fee type">
                            <FeeTypeToggle
                              value={form.feeType}
                              onChange={(v) => set("feeType", v)}
                            />
                          </Field>
                          <Field
                            label={
                              form.feeType === "percentage"
                                ? "Fee percentage"
                                : "Flat fee amount"
                            }
                            hint={
                              form.feeType === "percentage"
                                ? "Applied to the Scheduled Payout Value per full position."
                                : "Fixed amount deducted per payout."
                            }
                          >
                            <NumberInput
                              value={form.feeValue}
                              onChange={(v) => set("feeValue", v)}
                              min={0.1}
                              max={
                                form.feeType === "percentage"
                                  ? boundary.maxPercentage
                                  : boundary.maxFlat
                              }
                              step={form.feeType === "percentage" ? 0.5 : 1000}
                              prefix={form.feeType === "percentage" ? "%" : "₦"}
                            />
                            {errors.feeValue && (
                              <p className="text-xs text-[#DC2626]">
                                {errors.feeValue}
                              </p>
                            )}
                          </Field>
                          {form.amount > 0 && form.positions > 0 && (
                            <div className="bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] overflow-hidden">
                              <div className="px-4 py-2.5 border-b border-[#C7D2FE]">
                                <p className="text-xs font-bold text-[#1746A2]">
                                  Payout preview — full position
                                </p>
                              </div>
                              {[
                                {
                                  label: "Scheduled Payout Value",
                                  value: fmt(calc.payoutPerFullPosition),
                                },
                                {
                                  label: `Group fee${
                                    form.feeType === "percentage"
                                      ? ` (${form.feeValue}%)`
                                      : ""
                                  }`,
                                  value: `– ${fmt(calc.feeAmount)}`,
                                },
                                {
                                  label:
                                    "Illustrative payout after Organization fee",
                                  value: fmt(calc.netPayout),
                                  bold: true,
                                },
                              ].map((r) => (
                                <div
                                  key={r.label}
                                  className={`flex justify-between px-4 py-2.5 gap-3 ${
                                    r.bold
                                      ? "border-t border-[#C7D2FE] bg-white"
                                      : ""
                                  }`}
                                >
                                  <p className="text-xs text-[#374151]">
                                    {r.label}
                                  </p>
                                  <p
                                    className={`text-xs text-right ${
                                      r.bold
                                        ? "font-bold text-[#0D1117]"
                                        : "text-[#6B7280]"
                                    }`}
                                  >
                                    {r.value}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Field label="Daily penalty rate (basis points)" hint="0 disables accrual. Prototype ceiling: 10 bps/day (0.10%); subject to production policy review.">
                      <NumberInput value={form.dailyPenaltyRateBps ?? 0} onChange={v => set("dailyPenaltyRateBps", v)} min={0} max={10} step={1} />
                      {errors.dailyPenaltyRateBps && <p className="text-xs text-red-700">{errors.dailyPenaltyRateBps}</p>}
                      <p className="text-sm text-[#6B7280]">Simple daily penalty on outstanding required principal after grace. No compounding or cap on accumulated charges. Partial principal payments reduce future accrual. Audited penalty reductions are permitted; principal cannot be waived. Terms are accepted before activation and locked afterwards. Post-Payout Default starts seven full calendar days after grace expiry if required principal remains unpaid after payout receipt.</p>
                    </Field>

                    {/* Recipient contribution policy */}
                    <Alert type="info">
                      Recipient own-Round contribution is always optional.
                      Skipping it creates no lateness, default or penalty.
                      Scheduled Payout Value remains unchanged.
                    </Alert>
                  </>
                )}

                {/* ── Step 5: Group rules ── */}
                {step === 5 && (
                  <>
                    <div className="bg-[#F8FAFF] rounded-xl border border-[#E2E6F0] px-4 py-3 text-sm text-[#374151] leading-relaxed">
                      Group rules are shown to every member before they can
                      join. Members must acknowledge them — along with their
                      personalized commitment — before the cycle launches.
                    </div>
                    <Alert type="info">{BASE_RULES}</Alert>
                    <Field
                      label="Group rules"
                      required
                      hint="Additional rules must comply with the baseline below. The baseline always takes precedence."
                    >
                      <textarea
                        value={form.rules}
                        onChange={(e) => set("rules", e.target.value)}
                        rows={10}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E2E6F0] rounded-[10px] text-[#0D1117] focus:outline-none focus:ring-2 focus:ring-[#1746A2] resize-none font-mono leading-relaxed"
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => set("rules", BASE_RULES)}
                      className="text-xs font-semibold text-[#1746A2] hover:underline"
                    >
                      Reset to default rules
                    </button>
                  </>
                )}

                {/* ── Step 6: Review & save ── */}
                {step === 6 && (
                  <div className="flex flex-col gap-4">
                    {[
                      {
                        heading: "Group basics",
                        rows: [
                          { label: "Name", value: form.name || "—" },
                          { label: "Visibility", value: form.visibility },
                          { label: "Currency", value: "NGN" },
                        ],
                      },
                      {
                        heading: "Contribution setup",
                        rows: [
                          {
                            label: "Amount per position",
                            value: fmt(form.amount),
                          },
                          {
                            label: "Frequency",
                            value:
                              form.frequency === "Biweekly"
                                ? "Bi-weekly (every 14 days)"
                                : form.frequency,
                          },
                          { label: "Positions", value: `${form.positions}` },
                          {
                            label: "Cycle start",
                            value: form.startDate
                              ? new Date(form.startDate).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  },
                                )
                              : "—",
                          },
                          {
                            label: "Cycle duration",
                            value: calc.cycleDuration,
                          },
                          ...(form.frequency === "Monthly"
                            ? [
                                {
                                  label: "Contributions open",
                                  value: `${form.contributionOpenDay}th of each month`,
                                },
                                {
                                  label: "Normal deadline",
                                  value: "Last calendar day of each month",
                                },
                                {
                                  label: "Grace period",
                                  value: `${form.gracePeriodDays} day${
                                    form.gracePeriodDays !== 1 ? "s" : ""
                                  } after month-end`,
                                },
                              ]
                            : form.frequency !== "Daily"
                              ? [
                                  {
                                    label: "Contribution window",
                                    value: `${form.contributionWindowDays} day${
                                      form.contributionWindowDays !== 1
                                        ? "s"
                                        : ""
                                    } per period`,
                                  },
                                  {
                                    label: "Grace period",
                                    value: `${form.gracePeriodDays} day${
                                      form.gracePeriodDays !== 1 ? "s" : ""
                                    } after deadline`,
                                  },
                                ]
                              : [
                                  {
                                    label: "Schedule",
                                    value:
                                      "Contributions expected on the day of each period",
                                  },
                                ]),
                          { label: "Time zone", value: form.timezone },
                        ],
                      },
                      {
                        heading: "Member commitment rules",
                        rows: [
                          {
                            label: "Shared positions",
                            value: form.allowSplit
                              ? `Allowed — up to ${form.splitParts} participants per position`
                              : "Not allowed (individual positions only)",
                          },
                          {
                            label: "Multiple positions",
                            value:
                              form.multiplePositions === "none"
                                ? "Not allowed"
                                : form.multiplePositions === "max"
                                  ? `Allowed (max ${form.maxPerMember} per member)`
                                  : "Allowed (no fixed maximum)",
                          },
                        ],
                      },
                      {
                        heading: "Financial policies",
                        rows: [
                          {
                            label: "Group fee",
                            value: form.feeEnabled
                              ? form.feeType === "percentage"
                                ? `${form.feeValue}% of Scheduled Payout Value`
                                : `${fmt(form.feeValue)} flat`
                              : "None",
                          },
                          {
                            label: "Daily penalty",
                            value: `${form.dailyPenaltyRateBps ?? 0} bps/day (${(form.dailyPenaltyRateBps ?? 0) / 100}%); simple required-principal basis; maximum 10 bps/day`,
                          },
                          {
                            label: "Recipient contribution",
                            value: "Optional — no lateness, default or penalty",
                          },
                        ],
                      },
                    ].map((section) => (
                      <div
                        key={section.heading}
                        className="rounded-xl border border-[#E2E6F0] overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-[#F8FAFF] border-b border-[#F1F3F8]">
                          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">
                            {section.heading}
                          </p>
                        </div>
                        <div className="divide-y divide-[#F1F3F8]">
                          {section.rows.map((r) => (
                            <div
                              key={r.label}
                              className="flex justify-between px-4 py-3 gap-4"
                            >
                              <p className="text-sm text-[#6B7280]">
                                {r.label}
                              </p>
                              <p className="text-sm font-semibold text-[#0D1117] text-right">
                                {r.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="bg-[#EEF2FF] rounded-xl border border-[#C7D2FE] px-4 py-3 text-sm text-[#374151] leading-relaxed">
                      <p className="font-semibold text-[#1746A2] mb-0.5">
                        Saving as draft
                      </p>
                      Your group will be saved as a draft. The cycle will not
                      begin until you complete recruitment, assign positions,
                      confirm financial settings, and confirm launch readiness.
                    </div>
                  </div>
                )}
              </div>

              {/* Step actions */}
              <div className="px-6 py-4 border-t border-[#F1F3F8] flex justify-between gap-3">
                {step > 1 ? (
                  <button
                    onClick={back}
                    className="px-5 py-2.5 text-sm font-semibold text-[#6B7280] hover:text-[#0D1117] border border-[#E2E6F0] rounded-xl hover:bg-[#F8FAFF] transition-colors"
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("owner-groups")}
                    className="px-5 py-2.5 text-sm font-semibold text-[#6B7280] hover:text-[#0D1117]"
                  >
                    Cancel
                  </button>
                )}
                {step < 6 ? (
                  <Button onClick={next}>Continue →</Button>
                ) : (
                  <Button onClick={saveDraft} variant="success" loading={saved}>
                    Save draft & start recruitment
                  </Button>
                )}
              </div>
            </div>

            {/* Calculator */}
            <div className="hidden lg:block">
              <CalcPanel f={form} calc={calc} />
            </div>
          </div>

          {/* Mobile calc bar */}
          <div className="lg:hidden mt-5 bg-[#0D1117] rounded-xl p-4">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              Live calculator
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Scheduled value",
                  value: form.amount && form.positions ? fmt(calc.gross) : "—",
                },
                {
                  label: "After fee (illustrative)",
                  value:
                    form.amount && form.positions ? fmt(calc.netPayout) : "—",
                },
                {
                  label: "Duration",
                  value: form.positions ? calc.cycleDuration : "—",
                },
                {
                  label: "Participants range",
                  value: form.positions
                    ? `${calc.minParticipants}–${calc.maxParticipants}`
                    : "—",
                },
              ].map((r) => (
                <div key={r.label}>
                  <p className="text-[10px] text-white/40 mb-0.5">{r.label}</p>
                  <p className="text-sm font-bold text-[#34D399]">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OwnerShell>
  )
}
