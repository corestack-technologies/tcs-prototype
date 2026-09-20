import { AuthLayout, EntryProgress } from '../auth/AuthLayout'
import { platformSettings } from '../settings/service'
import { useState } from "react"
import { Alert, Button, Field, Input } from "../components/ui"
import { useClient } from "./ClientContext"
import { contactComplete } from "./model"
import { clientPrototypePolicy, verifyLocalContact } from "./service"
import { Section, type ClientPageProps } from "./ClientShell"

export function ClientContact({ navigate }: ClientPageProps) {
  const { client, update } = useClient()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  if (!client) return null
  const channel = platformSettings.verificationMode === "PHONE" ? "phone" : client.contacts.email ? "phone" : "email"
  const complete = contactComplete(client)
  return (
    <AuthLayout><EntryProgress current={1}/>
      <div className="mx-auto max-w-xl">
        <Section
          title={
            complete
              ? "Your contact details are confirmed"
              : `Confirm your ${
                  channel === "email" ? "email address" : "phone number"
                }`
          }
          description={
            complete
              ? "Contact confirmation is complete. Identity review is a separate step."
              : `This contact belongs to ${client.profile.firstName}’s Member account.`
          }
        >
          <div className="mb-6 grid grid-cols-2 gap-3">
            {(["email", "phone"] as const).map((item) => (
              <div
                key={item}
                className={`rounded-xl p-3 text-sm ${
                  client.contacts[item]
                    ? "bg-[var(--tcs-success-soft)] text-[var(--tcs-success-700)]"
                    : "bg-[var(--tcs-brand-subtle)] text-[var(--tcs-text-soft)]"
                }`}
              >
                <p className="font-semibold">
                  {item === "email" ? "Email" : "Phone"}
                </p>
                <p className="mt-1">
                  {client.contacts[item]
                    ? "Confirmed"
                    : "Awaiting confirmation"}
                </p>
              </div>
            ))}
          </div>
          {complete ? (
            <Button className="w-full" onClick={() => navigate("onboarding")}>
              Continue to onboarding
            </Button>
          ) : (
            <>
              <p className="mb-5 break-all text-lg font-semibold">
                {client.profile[channel]}
              </p>
              <details className="mt-4 text-sm"><summary>Demo verification helper</summary><Alert type="info">
                {clientPrototypePolicy.allowLocalContactCode ? (
                  <>
                    Prototype OTP · No SMS or email has been sent. Enter{" "}
                    <strong className="tracking-widest">
                      {clientPrototypePolicy.localContactCode}
                    </strong>{" "}
                    to confirm this contact in the local account record.
                  </>
                ) : (
                  "Prototype contact confirmation is currently disabled. No SMS or email has been sent."
                )}
              </Alert></details>
              <form
                className="mt-6 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  setError("")
                  try {
                    update((member) =>
                      verifyLocalContact(member, channel, code),
                    )
                    setCode("")
                  } catch (err) {
                    setError(
                      err instanceof Error ? err.message : "Please try again.",
                    )
                  }
                }}
              >
                <Field
                  label="Verification code"
                  error={error}
                  hint="Enter all six digits."
                >
                  <Input
                    value={code}
                    onChange={(event) =>
                      setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="text-center text-xl tracking-[0.4em]"
                    disabled={!clientPrototypePolicy.allowLocalContactCode}
                  />
                </Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !clientPrototypePolicy.allowLocalContactCode ||
                    code.length !== 6
                  }
                >
                  Confirm {channel}
                </Button>
              </form>
              <p className="mt-5 text-sm leading-6 text-[var(--tcs-text-muted)]">
                The contact shown here is the one entered at signup. Resend and
                contact-change verification require the connected delivery
                service.
              </p>
            </>
          )}
          <button
            className="mt-6 text-sm font-semibold text-[var(--tcs-brand)] hover:underline"
            onClick={() => navigate("dashboard")}
          >
            Return to Home
          </button>
        </Section>
      </div>
    </AuthLayout>
  )
}
