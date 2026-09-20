import { EntryProgress } from '../auth/AuthLayout'
import { useEffect, useId, useState } from "react"
import { Alert, Button, Field, Input } from "../components/ui"
import { useClient } from "./ClientContext"
import { contactComplete, fullName } from "./model"
import { editIdentity, submitIdentity, respondToVerification } from "./service"
import {
  ClientShell,
  Section,
  StatusChip,
  type ClientPageProps,
} from "./ClientShell"

function Attachment({
  title,
  file,
  onChange,
}: {
  title: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  const id = useId()
  const [error, setError] = useState("")
  const [url, setUrl] = useState("")
  useEffect(() => {
    if (!file) {
      setUrl("")
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return (
    <div className="rounded-xl border border-dashed border-[var(--tcs-border-strong)] bg-[var(--tcs-brand-subtle)] p-4">
      <label htmlFor={id} className="block text-sm font-semibold">
        {title}
      </label>
      <p
        id={`${id}-hint`}
        className="my-2 text-sm leading-6 text-[var(--tcs-text-muted)]"
      >
        A clear JPG, PNG or PDF, up to 5 MB. Attached only to this local
        session.
      </p>
      <input
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        aria-describedby={`${id}-hint`}
        className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-[var(--tcs-brand)]"
        onChange={(event) => {
          const selected = event.target.files?.[0]
          if (!selected) return
          if (
            !["image/jpeg", "image/png", "application/pdf"].includes(
              selected.type,
            ) ||
            selected.size === 0 ||
            selected.size > 5 * 1024 * 1024
          ) {
            setError("Choose a non-empty JPG, PNG or PDF no larger than 5 MB.")
            event.target.value = ""
            return
          }
          setError("")
          onChange(selected)
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-[var(--tcs-danger)]">
          {error}
        </p>
      )}
      {file && (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="break-all text-[var(--tcs-success-700)]">
            Attached: {file.name}
          </span>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="tcs-link">
              Preview document
            </a>
          )}
          <button
            type="button"
            className="tcs-link"
            onClick={() => {
              onChange(null)
              const input = document.getElementById(
                id,
              ) as HTMLInputElement | null
              if (input) input.value = ""
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

export function ClientVerification({ navigate }: ClientPageProps) {
  const { client, update } = useClient()
  const [response,setResponse]=useState("")
  const [responseFile,setResponseFile]=useState<File|null>(null)
  const [error, setError] = useState("")
  const [acknowledged, setAcknowledged] = useState(false)
  if (!client) return null
  const verification = client.verification
  const canPrepare =
    client.onboardingComplete &&
    contactComplete(client) &&
    verification.status === "required" &&
    !verification.submission &&
    client.accountStatus !== "closed"
  const submit = () => {
    setError("")
    try {
      update((value) => submitIdentity(value, acknowledged))
      navigate("success")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit your verification. Please try again.",
      )
    }
  }

  return (
    <ClientShell navigate={navigate} active="verification">
      <div className="auth-journey"><EntryProgress current={3}/><div className="auth-journey-header">
        <h1 className="auth-title">
          Verification
        </h1>
        <p className="mt-3 text-base text-[var(--tcs-text-muted)]">
          Confirm the identity behind your Member profile. Prepare your information for independent review.
        </p>
      </div>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium">{fullName(client)}</p>
          <Button variant="ghost" onClick={() => navigate("client-profile")}>
            View Profile
          </Button>
        </div>
        <Section
          title="Identity verification"
          description="Your current status and next step."
        >
          <StatusChip client={client} identityOnly />
          {!client.onboardingComplete && (
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => navigate("onboarding")}
            >
              Complete Profile
            </Button>
          )}
          {verification.note && (
            <Alert
              type={verification.status === "rejected" ? "error" : "warning"}
              className="mt-4"
            >
              {verification.note}
            </Alert>
          )}
          {verification.status === "pending" && (
            <div className="mt-4 space-y-3 text-sm leading-6">
              <p>
                Your submission is pending independent review. It will not be
                automatically approved.
              </p>
              {verification.submittedAt && (
                <p className="text-[var(--tcs-text-muted)]">
                  Submitted{" "}
                  {new Date(verification.submittedAt).toLocaleString("en-NG")}
                </p>
              )}
              <p className="text-[var(--tcs-text-muted)]">
                Your submission is available to the authorized Operations reviewer.
              </p>
            </div>
          )}
          {verification.status === 'information-required' && <div className="space-y-3 mt-4"><label className="block text-sm">Requested information<textarea className="block w-full border rounded-lg p-3 mt-2" value={response} onChange={e=>setResponse(e.target.value)}/></label><Attachment title="Supporting verification evidence" file={responseFile} onChange={setResponseFile}/><Button onClick={()=>{try{update(value=>respondToVerification(value,response,responseFile));setError('')}catch(e){setError((e as Error).message)}}}>Submit requested information</Button></div>}
          {verification.status === "verified" && (
            <p className="mt-4 text-sm leading-6 text-[var(--tcs-text-muted)]">
              Identity verified. Verification does not itself create a Group
              membership or an Organization.
            </p>
          )}
          {!client.onboardingComplete && (
            <p className="mt-4 text-sm leading-6 text-[var(--tcs-text-muted)]">
              Complete your personal information and address before preparing
              your identity submission.
            </p>
          )}
          {canPrepare && <p className="mt-4 rounded-xl bg-[var(--tcs-brand-subtle)] p-4 text-sm leading-6">Have your 11-digit NIN, NIN slip or card, and proof of address ready. Review your details before submitting. Your documents go to an independent reviewer; submission does not mean approval.</p>}
          {canPrepare && (
            <form
              className="mt-6 space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
            >
              <Field
                label="National Identification Number (NIN)"
                required
                hint="11 digits. Use sample information in this local prototype."
              >
                <Input
                  inputMode="numeric"
                  maxLength={11}
                  value={client.identity.nin}
                  onChange={(event) =>
                    update((value) =>
                      editIdentity(value, {
                        nin: event.target.value.replace(/\D/g, "").slice(0, 11),
                      }),
                    )
                  }
                />
              </Field>
              <Attachment
                title="NIN slip or card"
                file={client.identity.ninDocument}
                onChange={(file) =>
                  update((value) => editIdentity(value, { ninDocument: file }))
                }
              />
              <Attachment
                title="Proof of address"
                file={client.identity.addressDocument}
                onChange={(file) =>
                  update((value) =>
                    editIdentity(value, { addressDocument: file }),
                  )
                }
              />
              <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
                Use a legible utility bill, bank statement or tenancy document
                showing your name and address.
              </p>
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--tcs-brand)]"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                I have reviewed my profile and attached the documents for this
                submission.
              </label>
              {error && <Alert type="error">{error}</Alert>}
              <Button type="submit" className="w-full">
                Submit for verification
              </Button>
            </form>
          )}
          {verification.submission && (
            <div className="mt-5 border-t border-[var(--tcs-border)] pt-5">
              <h3 className="text-sm font-semibold">Submitted record</h3>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {Object.entries(verification.submission.profile).map(
                  ([key, value]) => (
                    <div key={key}>
                      <dt className="text-[var(--tcs-text-muted)]">
                        {key.replace(/([A-Z])/g, " $1")}
                      </dt>
                      <dd className="break-words">{value || "Not added"}</dd>
                    </div>
                  ),
                )}
              </dl>
              <p className="mt-2 text-sm text-[var(--tcs-text-muted)]">
                NIN ending {verification.submission.nin.slice(-4)}
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {verification.submission.documents.map((name, index) => (
                  <li className="break-all" key={index}>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <details><summary className="text-sm font-semibold">Verification history</summary><Section title="Verification history">
          <ol className="space-y-4">
            {client.history
              .filter((event) => /identity|verification/i.test(event.action))
              .map((event, index) => (
                <li key={index}>
                  <p className="text-sm font-medium">{event.action}</p>
                  <time
                    className="mt-1 block text-sm text-[var(--tcs-text-muted)]"
                    dateTime={event.at}
                  >
                    {new Date(event.at).toLocaleString("en-NG")}
                  </time>
                </li>
              ))}
          </ol>
          {!client.verification.submission && (
            <p className="text-sm text-[var(--tcs-text-muted)]">
              No identity submission yet. Complete your Profile, then prepare
              your documents here.
            </p>
          )}
        </Section></details>
      </div></div>
    </ClientShell>
  )
}
