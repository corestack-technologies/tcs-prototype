import { PageHeader, DisplayDate } from '../design/foundation'
import { AvatarEditor } from "./MemberAvatar"
import { BankDetailsEditor } from "./BankDetailsEditor"
import { useState } from "react"
import { Alert, Button } from "../components/ui"
import { useClient } from "./ClientContext"
import { closureEligibility, contactComplete, fullName } from "./model"
import { requestClosure } from "./service"
import {
  ClientShell,
  Section,
  StatusChip,
  type ClientPageProps,
} from "./ClientShell"

export function ClientProfile({ navigate }: ClientPageProps) {
  const { client, update } = useClient()
  const [closureOpen, setClosureOpen] = useState(false)
  const [closureConfirmed, setClosureConfirmed] = useState(false)
  if (!client) return null
  const profile = client.profile
  const verification = client.verification
  const clearance = closureEligibility(client.clearance)
  const details = [
    { label: "Full name", value: fullName(client) },
    { label: "Birth date", value: profile.dob },
    { label: "Gender", value: profile.gender },
    { label: "Preferred language", value: profile.language },
    {
      label: "Primary email",
      value: `${profile.email} / ${
        client.contacts.email ? "Confirmed" : "Unconfirmed"
      }`,
    },
    {
      label: "Primary phone",
      value: `${profile.phone} / ${
        client.contacts.phone ? "Confirmed" : "Unconfirmed"
      }`,
    },
    {
      label: "Home address",
      value: [profile.address, profile.city, profile.state]
        .filter(Boolean)
        .join(", "),
    },
  ]
  return (
    <ClientShell navigate={navigate} active="profile">
      <PageHeader title="Profile" description="Your personal information, contacts and account status." actions={<StatusChip client={client}/>}/>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section
            title="Display picture"
            description="Your Member avatar. This is not identity-verification evidence."
          >
            <AvatarEditor />
          </Section>
          <Section
            title="Personal information"
            description="Your identity and home address."
          >
            <dl className="grid gap-5 sm:grid-cols-2">
              {details.filter(item=>!item.label.startsWith("Primary")).map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-[var(--tcs-text-muted)]">
                    {item.label}
                  </dt>
                  <dd className="mt-1 break-words text-base font-medium">
                    {item.label === "Birth date" && item.value ? <DisplayDate value={item.value}/> : item.value || "Not added yet"}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              {!contactComplete(client) ? (
                <Button onClick={() => navigate("otp")}>
                  Verify contact details
                </Button>
              ) : verification.status === "required" &&
                !verification.submission &&
                client.accountStatus !== "closed" ? (
                <Button
                  variant="secondary"
                  onClick={() => navigate("onboarding")}
                >
                  {client.onboardingComplete
                    ? "Edit profile details"
                    : "Complete your profile"}
                </Button>
              ) : (
                <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
                  These details belong to your verification record. A reviewed
                  change workflow will be connected with Operations.
                </p>
              )}
            </div>
          </Section>
          <Section title="Contact information"><dl className="grid gap-5 sm:grid-cols-2">{details.filter(item=>item.label.startsWith("Primary")).map(item=><div key={item.label}><dt className="text-sm">{item.label}</dt><dd className="mt-1 break-words font-medium">{item.value}</dd></div>)}</dl></Section>
          <Section
            title="Bank / payout details"
            description="Resolve the account name, confirm the result, then save your bank details."
          >
            <BankDetailsEditor />
          </Section>
          <Section
            title="Account access"
            description="You are signed in to a local prototype session."
          >
            <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
              Changing a confirmed email or phone requires re-verification.
              Password recovery and device/session controls require the
              connected account service. Sign out is available in the header.
            </p>
            {client.accountStatus !== "active" && (
              <Alert type="warning" className="mt-4">
                New participation may be restricted. Essential account access
                and existing financial responsibilities remain available; this
                module does not manage those obligations.
              </Alert>
            )}
          </Section>
          <Section
            title="Account closure"
            description="Closure is a reviewed request, not deletion of your history."
          >
            <p className="text-sm leading-6 text-[var(--tcs-text-muted)]">
              Active Cycles, contributions due, payouts awaiting receipt,
              recovery and unresolved disputes must be cleared. TCS reviews the
              request and obtains Organization clearance where applicable.
            </p>
            {client.closureRequestedAt ? (
              <Alert
                type="info"
                className="mt-4"
                title="Closure request recorded"
              >
                Awaiting clearance and TCS review. Your account has not been
                closed. This request is local until Operations is connected.
              </Alert>
            ) : (
              <>
                <p className="my-4 text-sm font-medium">
                  {clearance === "blocked"
                    ? "Closure unavailable: unresolved participation or financial cases remain."
                    : clearance === "clear"
                      ? "No blockers recorded. TCS approval is still required."
                      : "Participation and case clearance will be confirmed during review."}
                </p>
                <Button
                  variant="ghost"
                  disabled={clearance === "blocked"}
                  onClick={() => setClosureOpen(!closureOpen)}
                >
                  Request closure review
                </Button>
                {closureOpen && (
                  <div className="mt-4 rounded-xl bg-[var(--tcs-surface-muted)] p-4">
                    <label className="flex items-start gap-3 text-sm leading-6">
                      <input
                        className="mt-1 h-4 w-4 accent-[var(--tcs-brand)]"
                        type="checkbox"
                        checked={closureConfirmed}
                        onChange={(event) =>
                          setClosureConfirmed(event.target.checked)
                        }
                      />
                      I understand this requests review only. Clearance and
                      approval are required, and historical records will be
                      retained.
                    </label>
                    <Button
                      className="mt-4"
                      disabled={!closureConfirmed}
                      onClick={() => {
                        update(requestClosure)
                        setClosureOpen(false)
                      }}
                    >
                      Submit review request
                    </Button>
                  </div>
                )}
              </>
            )}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Identity and account status"><div className="space-y-4"><StatusChip client={client} identityOnly/><p className="text-sm text-[var(--tcs-text-muted)]">Profile: {client.onboardingComplete ? "Complete" : "In progress"}. Account: {client.accountStatus}.</p><Button variant="secondary" onClick={()=>navigate("client-verification")}>Review verification</Button><Button variant="ghost" onClick={()=>navigate("my-groups")}>View participation</Button></div></Section>
          <details className="member-history"><summary>Account activity</summary><Section title="Account activity">
            <ol className="space-y-5">
              {client.history
                .filter((event) => !/identity|verification/i.test(event.action))
                .slice()
                .reverse()
                .map((event, index) => (
                  <li key={`${event.at}-${index}`}>
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
          </Section></details>
        </div>
      </div>
    </ClientShell>
  )
}
