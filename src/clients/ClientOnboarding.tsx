import { EntryProgress } from '../auth/AuthLayout'
import { BankDetailsEditor } from "./BankDetailsEditor"
import { useState } from "react"
import { Alert, Button, Field, Input, Select } from "../components/ui"
import { useClient } from "./ClientContext"
import { contactComplete, fullName, profileErrors, type Profile } from "./model"
import { editProfile, finishOnboarding } from "./service"
import { ClientShell, Section, type ClientPageProps } from "./ClientShell"

const steps = [
  "Personal details",
  "Home address",
  "Bank details",
  "Review profile",
]
export function ClientOnboarding({ navigate }: ClientPageProps) {
  const { client, update } = useClient()
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (!client) return null
  if (!contactComplete(client))
    return (
      <ClientShell navigate={navigate} active="profile">
        <Section title="Confirm your contact first">
          <p className="mb-5 text-sm">
            Contact verification comes before onboarding.
          </p>
          <Button onClick={() => navigate("otp")}>Verify contact</Button>
        </Section>
      </ClientShell>
    )
  if (
    client.verification.status !== "required" ||
    !!client.verification.submission ||
    client.accountStatus === "closed"
  )
    return (
      <ClientShell navigate={navigate} active="profile">
        <Section title="Your submitted profile">
          <p className="mb-5 text-sm leading-6">
            A reviewed identity change workflow will be connected with
            Operations. Your submitted details remain available in Verification.
          </p>
          <Button onClick={() => navigate("client-profile")}>
            View profile
          </Button>
        </Section>
      </ClientShell>
    )
  const profile = client.profile
  const set = (key: keyof Profile, value: string) => {
    update((member) => editProfile(member, key, value))
    setErrors((previous) => ({ ...previous, [key]: "" }))
  }
  const field = (
    key: keyof Profile,
    label: string,
    options: {
      type?: string
      required?: boolean
      hint?: string
      autoComplete?: string
    } = {},
  ) => (
    <Field
      label={label}
      required={options.required}
      hint={options.hint}
      error={errors[key]}
    >
      <Input
        type={options.type || "text"}
        value={profile[key]}
        onChange={(event) => set(key, event.target.value)}
        autoComplete={options.autoComplete}
        error={!!errors[key]}
        max={key === "dob" ? new Date().toISOString().slice(0, 10) : undefined}
        inputMode={key === "accountNumber" ? "numeric" : undefined}
      />
    </Field>
  )
  const proceed = () => {
    const allErrors = profileErrors(profile)
    const keys =
      step === 0
        ? ["firstName", "lastName", "dob"]
        : step === 1
          ? ["address", "city", "state"]
          : step === 2
            ? ["bankName", "accountNumber", "accountName"]
            : Object.keys(allErrors)
    const currentErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([key]) => keys.includes(key)),
    )
    setErrors(currentErrors)
    if (Object.keys(currentErrors).length) return
    if (step < 3) {
      setStep(step + 1)
      return
    }
    update(finishOnboarding)
    navigate("client-profile")
  }
  return (
    <ClientShell navigate={navigate} active="profile">
      <div className="auth-journey"><EntryProgress current={2}/><header className="auth-journey-header"><h1>Let's complete your profile.</h1><p>Contact confirmed. Add your details, then prepare your identity documents. Your progress stays in this session.</p></header><p className="mb-3 text-sm font-semibold" role="status">Step {step + 1} of {steps.length}: {steps[step]}</p><ol className="auth-step-list" aria-label="Profile steps">{steps.map((label,index)=><li key={label} aria-current={index===step?'step':undefined}>{index+1}. {label}{index<step?' - completed':''}</li>)}</ol><div>
        <Section
          title={steps[step]}
          description={
            [
              "Use the details shown on your identity document.",
              "Tell us where you currently live.",
              "Optional. Resolve and confirm sample bank details here, or add them later in Profile.",
              "Check your information before completing onboarding.",
            ][step]
          }
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              proceed()
            }}
            className="space-y-6"
          >
            {step === 0 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  {field("firstName", "First name", {
                    required: true,
                    autoComplete: "given-name",
                  })}
                  {field("lastName", "Last name", {
                    required: true,
                    autoComplete: "family-name",
                  })}
                  {field("middleName", "Middle name", {
                    autoComplete: "additional-name",
                    hint: "Optional",
                  })}
                  {field("dob", "Date of birth", {
                    type: "date",
                    required: true,
                    hint: "Minimum Member age is 18 years for MVP.",
                    autoComplete: "bday",
                  })}
                  <Field label="Gender" hint="Optional">
                    <Select
                      value={profile.gender}
                      onChange={(event) => set("gender", event.target.value)}
                    >
                      <option value="">Select if you wish</option>
                      <option>Female</option>
                      <option>Male</option>
                      <option>Prefer not to say</option>
                    </Select>
                  </Field>
                  <Field label="Preferred language">
                    <Select
                      value={profile.language}
                      onChange={(event) => set("language", event.target.value)}
                    >
                      {["English", "Yoruba", "Igbo", "Hausa", "Pidgin"].map(
                        (language) => (
                          <option key={language}>{language}</option>
                        ),
                      )}
                    </Select>
                  </Field>
                </div>
                <div className="rounded-xl bg-[var(--tcs-brand-subtle)] p-4">
                  <h3 className="text-sm font-semibold">
                    Verified contact details
                  </h3>
                  <p className="mt-2 break-all text-sm text-[var(--tcs-text-soft)]">
                    {profile.email}
                  </p>
                  <p className="mt-1 text-sm text-[var(--tcs-text-soft)]">
                    {profile.phone}
                  </p>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                {field("address", "Street address", {
                  required: true,
                  autoComplete: "street-address",
                })}
                <div className="grid gap-5 sm:grid-cols-2">
                  {field("city", "City / town", {
                    required: true,
                    autoComplete: "address-level2",
                  })}
                  {field("state", "State / FCT", {
                    required: true,
                    autoComplete: "address-level1",
                  })}
                </div>
                <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
                  Your proof of address will be attached during identity
                  verification.
                </p>
              </>
            )}
            {step === 2 && <BankDetailsEditor />}
            {step === 3 && (
              <>
                <dl className="grid gap-5 sm:grid-cols-2">
                  {[
                    { label: "Full name", value: fullName(client) },
                    { label: "Birth date", value: profile.dob },
                    { label: "Email", value: profile.email },
                    { label: "Phone", value: profile.phone },
                    {
                      label: "Address",
                      value: [
                        profile.address,
                        profile.city,
                        profile.state,
                      ].join(", "),
                    },
                    {
                      label: "Bank details",
                      value: client.bankDetails
                        ? `${client.bankDetails.bankName} ? ending ${client.bankDetails.accountNumber.slice(-4)} (demo-confirmed)`
                        : profile.accountNumber
                          ? `${profile.bankName} · ending ${profile.accountNumber.slice(-4)}`
                          : "Not added",
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-sm text-[var(--tcs-text-muted)]">
                        {item.label}
                      </dt>
                      <dd className="mt-1 break-words font-medium">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <Alert type="info">
                  Next, attach your identity documents from Verification. Your
                  account will remain unverified until independently reviewed.
                </Alert>
              </>
            )}
            {step === 3 && Object.keys(errors).length > 0 && (
              <Alert type="error">
                Some profile details need correction. Go back to complete the
                highlighted fields.
              </Alert>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--tcs-border)] pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  step > 0 ? setStep(step - 1) : navigate("client-profile")
                }
              >
                {step > 0 ? "Back" : "Save & leave"}
              </Button>
              <Button type="submit">
                {step === 3 ? "Complete profile" : "Continue"}{" "}
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          </form>
        </Section>
      </div>
      </div>
    </ClientShell>
  )
}
