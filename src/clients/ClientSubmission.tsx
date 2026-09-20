import { EntryProgress } from '../auth/AuthLayout'
import { Button } from "../components/ui"
import { useClient } from "./ClientContext"
import {
  ClientShell,
  Section,
  StatusChip,
  type ClientPageProps,
} from "./ClientShell"

export function ClientSubmission({ navigate }: ClientPageProps) {
  const { client } = useClient()
  if (!client) return null
  const pending = client.verification.status === "pending"
  return (
    <ClientShell navigate={navigate} active="verification">
      <div className="auth-journey"><EntryProgress current={3}/>
        <Section
          title={
            pending
              ? "Your verification has been submitted"
              : "Your verification status"
          }
          description={
            pending
              ? `Thank you, ${client.profile.firstName}. Your submission is recorded in this local session and is awaiting independent review.`
              : "Your current account record is shown below."
          }
        >
          <StatusChip client={client} />
          <ol className="my-8 space-y-6">
            {[
              {
                title: "Profile completed",
                description:
                  "Your personal information and address belong to the same Member record.",
              },
              {
                title: pending ? "Documents submitted" : "Verification record",
                description: pending
                  ? "You can review your submitted information at any time during this session."
                  : "Your profile reflects the current verification state.",
              },
              {
                title: "Independent TCS review",
                description:
                  "Operations will provide decisions and requests for more information. This prototype does not automatically approve you or promise a review time.",
              },
            ].map((item, index) => (
              <li className="flex gap-4" key={item.title}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tcs-brand-soft)] text-sm font-semibold text-[var(--tcs-brand)]">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--tcs-text-muted)]">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("client-verification")}>
              Review submitted record
            </Button>
            <Button variant="secondary" onClick={() => navigate("dashboard")}>
              Go to Home
            </Button>
          </div>
        </Section>
      </div>
    </ClientShell>
  )
}
