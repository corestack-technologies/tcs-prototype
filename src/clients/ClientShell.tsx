import './member.css'
import { ResponsiveNavigation } from '../design/foundation'
import { useOrganization } from '../organizations/OrganizationContext'
import { hasWorkspace } from '../organizations/model'
import { MemberAvatar } from "./MemberAvatar"
import type { ReactNode } from "react"
import type { NavMeta, View } from "../App"
import { Logo } from "../components/ui"
import { useClient } from "./ClientContext"
import { clientStatus, verificationStatus } from "./model"
import { demoPersonas } from "./seeds"

export interface ClientPageProps {
  navigate: (view: View, meta?: NavMeta) => void
}
export function ClientShell({
  navigate,
  active = "home",
  children,
}: ClientPageProps & {
  active?: "reports" | "home" | "profile" | "verification" | "organization" | "groups" | "payments" | "payouts"
  children: ReactNode
}) {
  const { client, logout } = useClient()
  const { organization } = useOrganization()
  if (!client) return null
  return (
    <div className="member-experience min-h-dvh bg-[var(--tcs-bg-cool)] text-[var(--tcs-text)]">
      <a
        href="#client-main"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <header className="border-b border-[var(--tcs-border)] bg-[var(--tcs-surface-raised)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <button onClick={() => navigate("dashboard")} aria-label="TCS home">
            <Logo size="sm" />
          </button>
          <div className="flex flex-wrap items-center gap-3">
            {organization && hasWorkspace(organization) && <button className="text-sm font-semibold text-[var(--tcs-brand)] hover:underline" onClick={() => navigate(organization.status === 'approved' ? 'org-activation' : 'owner-dashboard')}>Switch to {organization.form.name}</button>}
            <button
              className="text-sm font-semibold text-[var(--tcs-brand)] hover:underline"
              onClick={() => navigate("login")}
            >
              Demo personas
            </button>
            <span className="hidden text-sm text-[var(--tcs-text-muted)] sm:block">
              Member workspace
            </span>
            <button
              onClick={() => navigate("client-profile")}
              aria-label="Open Member profile"
            >
              <MemberAvatar client={client} />
            </button>
            <button
              className="text-sm font-semibold text-[var(--tcs-text-soft)] hover:underline"
              onClick={() => {
                logout()
                navigate("login")
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="member-nav max-w-6xl mx-auto px-4 sm:px-8"><ResponsiveNavigation label="Member navigation" currentLabel={active === "home" ? "Home" : active.charAt(0).toUpperCase()+active.slice(1)}>
          {([
            { label: "Home", view: "dashboard", key: "home" },
            { label: "My Groups", view: "my-groups", key: "groups" },
            { label: "Payments", view: "member-payments", key: "payments" },
            { label: "Payouts", view: "member-payouts", key: "payouts" },
            {
              label: "Profile",
              view: "client-profile",
              key: "profile",
            },
            {
              label: "Verification",
              view: "client-verification",
              key: "verification",
            },
            { label: "Reports", view: "member-reports", key: "reports" },
            { label: "Organization", view: "org-opportunity", key: "organization" },
          ] as const).map((item) => (
            <button
              key={item.key}
              aria-current={active === item.key ? "page" : undefined}
              onClick={() => navigate(item.view)}
              className={`border-b-2 pb-4 pt-1 text-sm font-semibold ${
                active === item.key
                  ? "border-[var(--tcs-brand)] text-[var(--tcs-brand)]"
                  : "border-transparent text-[var(--tcs-text-muted)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </ResponsiveNavigation></div>
      </header>
      <main
        id="client-main"
        className="tcs-container mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12"
      >
        {client.example && (
          <div className="member-demo-notice mb-6 rounded-xl bg-[var(--tcs-warning-soft)] px-4 py-3 text-sm text-[#785015]">
            Prototype Member ·{" "}
            {demoPersonas.find((persona) => persona.id === client.personaId)
              ?.label || "Sample account"}{" "}
            · Sample data for product review.
          </div>
        )}
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-5 pb-8 text-sm leading-6 text-[var(--tcs-text-muted)] sm:px-8">
        Local prototype session · Details are retained during navigation and
        sign-out, but clear when this page reloads. No data is sent to TCS.
      </footer>
    </div>
  )
}
export function StatusChip({
  client,
  identityOnly = false,
}: {
  client: NonNullable<ReturnType<typeof useClient>["client"]>
  identityOnly?: boolean
}) {
  const status = identityOnly
    ? verificationStatus(client)
    : clientStatus(client)
  const tones: Record<string, string> = {
    brand: "bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand-800)]",
    success: "bg-[var(--tcs-success-soft)] text-[var(--tcs-success-700)]",
    warning: "bg-[var(--tcs-warning-soft)] text-[#785015]",
    danger: "bg-[var(--tcs-danger-soft)] text-[var(--tcs-danger)]",
    neutral: "bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-soft)]",
  }
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${tones[status.tone]}`}
    >
      {status.label}
    </span>
  )
}
export function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--tcs-shadow-sm)] sm:p-7">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">
          {description}
        </p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  )
}
