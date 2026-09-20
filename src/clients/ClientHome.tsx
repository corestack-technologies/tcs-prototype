import { PageHeader } from '../design/foundation'
import { PublicRestrictions } from '../operations/PublicStatus'
import { Button } from "../components/ui"
import { MemberActivityPanel } from "./MemberActivityPanel"
import { useClient } from "./ClientContext"
import {
  clientStatus,
  contactComplete,
  fullName,
  verificationStatus,
} from "./model"
import {
  ClientShell,
  Section,
  StatusChip,
  type ClientPageProps,
} from "./ClientShell"

export function ClientHome({ navigate }: ClientPageProps) {
  const { client } = useClient()
  if (!client) return null
  const status = clientStatus(client)
  if (client.activity)
    return (
      <ClientShell navigate={navigate}>
        <PublicRestrictions records={client.restrictions}/>
        <PageHeader title={`Welcome back, ${client.profile.firstName}.`} description="Your participation, upcoming contributions and payout updates." actions={<StatusChip client={client}/>}/>
        <section
          className={`flex flex-wrap items-center justify-between gap-5 rounded-2xl p-5 sm:p-6 ${
            client.accountStatus === "active"
              ? "bg-white border border-[var(--tcs-border)]"
              : "bg-[var(--tcs-warning-soft)] text-[#785015]"
          }`}
        >
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold">{status.title}</h2>
            <p
              className={`mt-2 text-sm leading-6 ${
                client.accountStatus === "active" ? "text-[var(--tcs-text-muted)]" : ""
              }`}
            >
              {status.detail}
            </p>
          </div>
          <Button onClick={() => navigate("client-profile")}>
            View Profile
          </Button>
        </section>
        <div className="member-next mt-5"><div><h2>Review your current commitments</h2><p>Open your Groups for current obligations, positions and next actions.</p></div><Button onClick={()=>navigate("my-groups")}>View my Groups</Button></div>
        <MemberActivityPanel activity={client.activity} />
      </ClientShell>
    )
  const steps = [
    {
      title: "Contact details",
      detail: "Email and phone confirmation",
      done: contactComplete(client),
    },
    {
      title: "Your profile",
      detail: "Personal information and home address",
      done: client.onboardingComplete,
    },
    {
      title: "Identity submission",
      detail: "Documents sent for review",
      done: client.verification.status !== "required",
    },
    {
      title: "TCS verification",
      detail: "Independent identity review",
      done: client.verification.status === "verified",
    },
  ]
  const progress = steps.filter((step) => step.done).length
  const action = !contactComplete(client)
    ? { label: "Verify contact details", view: "otp" as const }
    : !client.onboardingComplete
      ? { label: "Complete your profile", view: "onboarding" as const }
      : {
          label:
            client.verification.status === "required"
              ? "Prepare verification"
              : "Review verification",
          view: "client-verification" as const,
        }
  return (
    <ClientShell navigate={navigate}>
        <PublicRestrictions records={client.restrictions}/>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--tcs-text-muted)]">
            YOUR MEMBER ACCOUNT
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome, {client.profile.firstName}.
          </h1>
        </div>
        <StatusChip client={client} />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="member-card bg-white p-6">
            <p className="mb-5 text-sm font-medium text-[var(--tcs-text-muted)]">
              A clear path to getting started
            </p>
            <h2 className="max-w-lg text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
              {status.title}
            </h2>
            <p className="mt-4 max-w-lg text-base leading-7 text-[var(--tcs-text-muted)]">
              {status.detail}
            </p>
            <Button className="mt-7" onClick={() => navigate(action.view)}>
              {action.label} <span aria-hidden="true">→</span>
            </Button>
          </section>
          <Section
            title="Your account, at a glance"
            description="One Member identity. Your details stay consistent wherever you use TCS."
          >
            <dl className="grid gap-6 sm:grid-cols-2">
              {[
                { label: "Full name", value: fullName(client) },
                { label: "Email address", value: client.profile.email },
                {
                  label: "Profile",
                  value: client.onboardingComplete ? "Complete" : "In progress",
                },
                { label: "Identity", value: verificationStatus(client).label },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-sm text-[var(--tcs-text-muted)]">
                    {item.label}
                  </dt>
                  <dd className="mt-1 break-words text-base font-medium">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        </div>
        <div className="space-y-6">
          <Section
            title="Getting ready"
            description={`${progress} of ${steps.length} milestones complete`}
          >
            <progress
              aria-label="Account setup progress"
              value={progress}
              max={steps.length}
              className="mb-6 h-2 w-full accent-[var(--tcs-brand)]"
            />
            <ol className="space-y-6">
              {steps.map((step, index) => (
                <li className="flex gap-3" key={step.title}>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      step.done
                        ? "bg-[var(--tcs-success-soft)] text-[var(--tcs-success-700)]"
                        : "bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand)]"
                    }`}
                    aria-label={step.done ? "Complete" : "Not complete"}
                  >
                    {step.done ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--tcs-text-muted)]">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
          <div className="px-2">
            <h2 className="text-base font-semibold">
              A foundation for what comes next
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">
              Complete your profile and identity verification to prepare for
              Group participation. Your Home will bring contributions, payout
              positions and important updates together.
            </p>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
