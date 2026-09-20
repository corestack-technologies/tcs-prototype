import { useState } from "react"
import { Alert, Button } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useClient } from "../../clients/ClientContext"
import { fullName } from "../../clients/model"
import { useOrganization } from "../../organizations/OrganizationContext"
import {
  OrganizationSection,
  OrganizationStatusChip,
} from "../../organizations/OrganizationUI"
import { clearanceLabels, closureBlockers } from "../../organizations/model"
import {
  requestOrganizationClosure,
  saveOrganizationNotifications,
} from "../../organizations/service"
import type { ClientPageProps } from "../../clients/ClientShell"

const recordText = (value: unknown) =>
  JSON.stringify(
    value,
    (_key, item) =>
      item instanceof File
        ? { name: item.name, size: item.size, type: item.type }
        : item,
    2,
  )
export function OwnerSettings({ navigate }: ClientPageProps) {
  const { client } = useClient()
  const { organization, updateOrganization } = useOrganization()
  const [notifications, setNotifications] = useState(
    organization?.notifications,
  )
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  if (!client || !organization || !notifications)
    return (
      <OwnerShell navigate={navigate} activeView="owner-settings">
        No Organization selected.
      </OwnerShell>
    )
  const blockers = closureBlockers(organization)
  const closed = organization.status === "closed"
  const closureAllowed =
    ["active", "restricted", "suspended"].includes(organization.status) &&
    !blockers.length
  return (
    <OwnerShell navigate={navigate} activeView="owner-settings">
      <div className="mb-7">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
          Business controls
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Settings & lifecycle
        </h1>
        <p className="mt-3 text-sm text-[#6b7280]">
          Preferences and the current Organization record for{" "}
          {organization.form.name}.
        </p>
      </div>
      {error && (
        <Alert type="error" className="mb-5">
          {error}
        </Alert>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <OrganizationSection
            title="Notification preferences"
            description={`Prototype preferences for ${client.profile.email}. No emails are sent from this session.`}
          >
            <div className="space-y-5">
              {([
                {
                  key: "applications",
                  label: "Application & business updates",
                },
                { key: "contributions", label: "Contribution status updates" },
                { key: "payouts", label: "Payout reminders" },
                { key: "announcements", label: "TCS announcements" },
              ] as const).map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-4 text-sm font-medium"
                >
                  {item.label}
                  <input
                    type="checkbox"
                    disabled={closed}
                    checked={notifications[item.key]}
                    className="h-5 w-5 accent-[#1746A2]"
                    onChange={(event) => {
                      setNotifications({
                        ...notifications,
                        [item.key]: event.target.checked,
                      })
                      setSaved(false)
                    }}
                  />
                </label>
              ))}
            </div>
            <Button
              className="mt-6"
              disabled={closed}
              onClick={() => {
                try {
                  updateOrganization((org) =>
                    saveOrganizationNotifications(org, client, notifications),
                  )
                  setSaved(true)
                  setError("")
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              Save preferences
            </Button>
            {saved && (
              <p role="status" className="mt-4 text-sm text-[#08714d]">
                Preferences saved for this Organization.
              </p>
            )}
          </OrganizationSection>
          <OrganizationSection title="Organization record">
            <OrganizationStatusChip organization={organization} />
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-[#6b7280]">Organization ID</dt>
                <dd className="mt-1 break-all font-mono">{organization.id}</dd>
              </div>
              <div>
                <dt className="text-[#6b7280]">Owner</dt>
                <dd className="mt-1 font-semibold">{fullName(client)}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-[#6b7280]">
              MVP has one Owner and no delegated staff roles or routine
              ownership transfer. Death, incapacity or exceptional succession
              requires controlled TCS support and externally validated
              legal/compliance review.
            </p>
          </OrganizationSection>
        </div>
        <div className="space-y-6">
          <OrganizationSection
            title="Organization closure"
            description="A reviewed closure request preserves your business and financial history."
          >
            <p className="text-sm leading-6 text-[#6b7280]">
              Normal closure requires clearance of active Cycles, payouts, exit
              settlements, defaults/recovery, disputes and TCS obligations.
            </p>
            {organization.clearance ? (
              <dl className="mt-5 space-y-3">
                {Object.entries(organization.clearance).map(([key, count]) => (
                  <div key={key} className="flex justify-between gap-4 text-sm">
                    <dt className="text-[#6b7280]">
                      {clearanceLabels[(key as keyof typeof clearanceLabels)]}
                    </dt>
                    <dd
                      className={`font-semibold ${
                        count ? "text-[#9b312c]" : "text-[#08714d]"
                      }`}
                    >
                      {count}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-5 text-sm">
                Clearance has not yet been established.
              </p>
            )}
            {organization.closureRequestedAt ? (
              <Alert
                type="info"
                className="mt-5"
                title={
                  closed
                    ? "Closure recorded in this scenario"
                    : "Closure review requested"
                }
              >
                Requested{" "}
                {new Date(organization.closureRequestedAt).toLocaleString(
                  "en-NG",
                )}
                .{" "}
                {closed
                  ? "Historical records remain visible and read-only."
                  : "Independent TCS review and clearance are outstanding. No financial cases have been resolved by this request."}
              </Alert>
            ) : (
              <>
                {blockers.length > 0 && (
                  <Alert
                    type="warning"
                    className="mt-5"
                    title="Normal closure unavailable"
                  >
                    {blockers.join(" · ")}
                  </Alert>
                )}
                {closureAllowed && (
                  <label className="mt-5 flex items-start gap-3 text-sm leading-6">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[#1746A2]"
                      checked={confirmed}
                      onChange={(event) => setConfirmed(event.target.checked)}
                    />
                    I understand this requests TCS review only. Clearance must
                    be confirmed and historical records will be retained.
                  </label>
                )}
                <Button
                  variant="secondary"
                  className="mt-5"
                  disabled={!closureAllowed || !confirmed}
                  onClick={() => {
                    try {
                      updateOrganization((org) =>
                        requestOrganizationClosure(org, client, confirmed),
                      )
                      setError("")
                    } catch (err) {
                      setError((err as Error).message)
                    }
                  }}
                >
                  Request closure review
                </Button>
              </>
            )}
            <p className="mt-5 text-sm leading-6 text-[#6b7280]">
              Unresolved cases cannot be cleared here. Exceptional Force Close
              and internal interventions belong to later Thrift and Operations
              workflows.
            </p>
          </OrganizationSection>
          <OrganizationSection title="Owner participation">
            <p className="text-sm leading-7 text-[#6b7280]">
              Ownership does not exclude you from your own Groups. In personal
              context you participate as the same Member, with the same
              obligations and rights. You cannot self-approve your own
              beneficial waiver, financial adjustment, write-off or other
              exception.
            </p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => navigate("dashboard")}
            >
              Switch to personal workspace
            </Button>
          </OrganizationSection>
        </div>
      </div>
      <div className="mt-6">
        <OrganizationSection
          title="Organization history"
          description="Material changes retain their actor, timestamp and previous values."
        >
          <ol className="space-y-5">
            {organization.history
              .slice()
              .reverse()
              .map((event, index) => (
                <li
                  key={`${event.at}-${index}`}
                  className="border-b border-[#e5eaf2] pb-5 last:border-0"
                >
                  <p className="text-sm font-semibold">{event.action}</p>
                  <p className="mt-2 text-xs text-[#6b7280]">
                    {event.actor === client.id ? fullName(client) : event.actor}{" "}
                    ·{" "}
                    <time dateTime={event.at}>
                      {new Date(event.at).toLocaleString("en-NG")}
                    </time>
                  </p>
                  {event.reason && (
                    <p className="mt-2 text-sm">Reason: {event.reason}</p>
                  )}
                  {(event.before !== undefined ||
                    event.after !== undefined) && (
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer text-[#1746A2]">
                        View retained change record
                      </summary>
                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        {[
                          ["Before", event.before],
                          ["After", event.after],
                        ].map(([label, value]) => (
                          <div key={String(label)}>
                            <p className="font-semibold">{String(label)}</p>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[#f4f7fc] p-3 text-xs">
                              {recordText(value) ?? "Not recorded"}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </li>
              ))}
          </ol>
        </OrganizationSection>
      </div>
    </OwnerShell>
  )
}
