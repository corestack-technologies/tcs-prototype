import { useState, type ReactNode } from "react"
import { Alert, Field, Select } from "../components/ui"
import { useClient } from "../clients/ClientContext"
import { canApply, organizationStatusLabels, type Organization } from "./model"
import { useOrganization } from "./OrganizationContext"
import { organizationScenarios, type OrganizationScenario } from "./seeds"
import type { ClientPageProps } from "../clients/ClientShell"

export function OrganizationStatusChip({
  organization,
}: {
  organization: Organization
}) {
  const tone = ["active", "approved"].includes(organization.status)
    ? "bg-[#e9f7ef] text-[#08714d]"
    : ["closed", "draft"].includes(organization.status)
      ? "bg-[#edf1f7] text-[#536174]"
      : ["suspended", "declined"].includes(organization.status)
        ? "bg-[#fff0ee] text-[#9b312c]"
        : "bg-[#fff5db] text-[#785015]"
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${tone}`}
    >
      {organizationStatusLabels[organization.status]}
    </span>
  )
}
export function OrganizationScenarios({ navigate }: ClientPageProps) {
  const { client } = useClient()
  const { scenario, selectScenario } = useOrganization()
  const [error, setError] = useState("")
  return (
    <details className="rounded-xl bg-white/80 p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-[var(--tcs-text-muted)]">
        Organization demo scenarios
      </summary>
      <div className="mt-4 max-w-xl space-y-3">
        <p className="leading-6 text-[var(--tcs-text-muted)]">
          Independent examples for the same signed-in Member. Each scenario has
          one Organization; your application and edits stay in their own
          scenario during this session.
        </p>
        <Field label="Review scenario">
          <Select
            disabled={!client || !canApply(client)}
            value={scenario}
            onChange={(event) => {
              try {
                selectScenario(event.target.value as OrganizationScenario)
                setError("")
                navigate("org-opportunity")
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            {organizationScenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>
        {(!client || !canApply(client)) && (
          <p>
            Use the Verified / active Member persona to inspect these examples.
          </p>
        )}
        {error && <Alert type="error">{error}</Alert>}
      </div>
    </details>
  )
}
export function OrganizationNotice({
  organization,
}: {
  organization: Organization
}) {
  if (organization.status === "suspended")
    return (
      <Alert type="warning" title="Organization suspended">
        New Group activation and new Cycle commencement are unavailable.
        Existing active Cycles normally continue under TCS oversight. Members
        retain access to contributions, payouts and disputes; historical records
        remain available.
      </Alert>
    )
  if (organization.status === "restricted")
    return (
      <Alert type="warning" title="New activity restricted">
        This sample Organization has an unpaid TCS obligation awaiting
        resolution. New Group activation and Cycle commencement are restricted;
        existing commitments continue. Contact TCS for the recorded restriction
        and next steps.
      </Alert>
    )
  if (organization.status === "closure-pending")
    return (
      <Alert type="info" title="Closure review pending">
        Your request is awaiting TCS review and clearance. The Organization has
        not been closed. Records and financial responsibilities are retained.
      </Alert>
    )
  if (organization.status === "closed")
    return (
      <Alert type="info" title="Closed Organization">
        This is a read-only historical record. Closure does not erase financial
        or audit history.
      </Alert>
    )
  return null
}
export function OrganizationSection({
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
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 text-sm leading-6 text-[var(--tcs-text-muted)]">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  )
}
