import { formatMoneyMinor } from '../../design/format'
import { PublicRestrictions, PublicReview } from '../../operations/PublicStatus'
import {useGroups} from '../../groups/GroupContext'
import {cycleOf} from '../../groups/model'
﻿import { Button } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useOrganization } from "../../organizations/OrganizationContext"
import { OrganizationBrand } from "../../organizations/OrganizationBrand"
import { OrganizationSection } from "../../organizations/OrganizationUI"
import { canStartNewActivity } from "../../organizations/model"
import type { ClientPageProps } from "../../clients/ClientShell"

const money = (value: number) => formatMoneyMinor(value * 100)
function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="tcs-surface rounded-2xl p-5">
      <p className="tcs-label">{label}</p>
      <p className="tcs-kpi mt-4 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 text-[#6b7280]">{sub}</p>
    </div>
  )
}
export function OwnerDashboard({ navigate }: ClientPageProps) {
  const { organization } = useOrganization()
  const {groups}=useGroups()
  if (!organization)
    return (
      <OwnerShell navigate={navigate} activeView="owner-dashboard">
        No Organization selected.
      </OwnerShell>
    )
  const activity = organization.activity
  const activeGroups = activity.groups.filter(
    (group) => group.status === "active",
  )
  const pending = organization.settlementChanges.find(
    (change) => change.status === "pending",
  )
  return (
    <OwnerShell navigate={navigate} activeView="owner-dashboard">
      <PublicRestrictions records={organization.restrictions}/><PublicReview review={organization.interventionReview}/>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#6b7280]">
            Organization overview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Your business at a glance
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6b7280]">
            A shared view of your community, business readiness and recorded
            activity.
          </p>
        </div>
        <Button
          onClick={() =>
            navigate(
              organization.status === "approved"
                ? "org-activation"
                : "owner-profile",
            )
          }
        >
          {organization.status === "approved"
            ? "Complete setup"
            : "Manage business profile"}
        </Button>
      </div>
      <section className="owner-card p-5"><OrganizationBrand form={organization.form}/></section>
      <section aria-label="Current workspace attention" className="mt-6"><h2 className="text-lg font-semibold">What needs your attention</h2><p className="mt-1 text-sm text-[var(--tcs-text-muted)]">Current Group records. Open a workspace to review amounts, status and the available action.</p><div className="owner-attention">{[
        {label:'Activated Cycles',value:groups.filter(g=>cycleOf(g).status==='activated').length,view:'owner-groups'},
        {label:'Draft Cycles to prepare',value:groups.filter(g=>cycleOf(g).status==='draft').length,view:'owner-groups'},
        {label:'Unresolved recoveries',value:groups.reduce((n,g)=>n+(g.lifecycle?.recoveries.filter(r=>r.status!=='resolved').length||0),0),view:'owner-groups'},
        {label:'Payout records to review',value:groups.reduce((n,g)=>n+(g.payouts?.records.filter(p=>!p.status.startsWith('completed')).length||0),0),view:'owner-payouts'},
      ].map(item=><button key={item.label} onClick={()=>navigate(item.view as 'owner-groups'|'owner-lifecycle'|'owner-payouts')}><strong>{item.value}</strong><span>{item.label}</span></button>)}</div><div className="flex flex-wrap gap-3 mb-6"><Button variant="secondary" onClick={()=>navigate('owner-collection')}>Review collections</Button><Button variant="secondary" onClick={()=>navigate('owner-reports')}>Review fees and TCS Revenue Share</Button></div></section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active Groups"
          value={String(activeGroups.length)}
          sub={`${activity.groups.length} Groups in the retained snapshot`}
        />
        <MetricCard
          label="Contributions recorded"
          value={money(activity.contributed)}
          sub="Historical sample total · separate from settlement"
        />
        <MetricCard
          label="Payouts recorded"
          value={money(activity.paidOut)}
          sub="Organization-controlled transfers in sample records"
        />
        <MetricCard
          label="Completed Cycles"
          value={String(activity.completedCycles)}
          sub="Historical Cycles remain intact"
        />
      </div>
      {activity.asOf && (
        <p className="mt-3 text-xs text-[#6b7280]">
          Representative activity snapshot: {activity.asOf}. These figures are
          sample records, not a live ledger.
        </p>
      )}
      <div className="mt-6 rounded-xl border border-[#E2E6F0] bg-white p-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-bold">Group preparation</h2><p className="text-sm text-[#6B7280] mt-1">{groups.length} Groups · {groups.filter(g=>cycleOf(g).status==='draft').length} draft Cycles · {groups.filter(g=>cycleOf(g).status==='activated').length} activated Cycles · {groups.filter(g=>cycleOf(g).status==='cancelled').length} cancelled</p></div><Button onClick={()=>navigate('owner-groups')}>Open Groups &amp; setup</Button></div>
      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <OrganizationSection
            title="Your Groups"
            description="Representative historical Group summaries. Prepare new Groups in Groups & setup."
          >
            {activity.groups.length ? (
              <div className="space-y-6">
                {activity.groups.map((group) => (
                  <article
                    key={group.id}
                    className="border-b border-[#e5eaf2] pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="mt-2 text-sm text-[#6b7280]">
                          {group.members} Members · {money(group.amount)} /{" "}
                          {group.frequency.toLowerCase()}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#1746A2]">
                        {group.status === "active"
                          ? "Active Cycle"
                          : "Completed"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-[#6b7280]">
                      <span>
                        Round {group.round} of {group.rounds}
                      </span>
                      <span>
                        {group.paid} of {group.members} contributions recorded
                      </span>
                    </div>
                    <progress
                      aria-label={`${group.name} Cycle progress`}
                      value={group.round}
                      max={group.rounds}
                      className="mt-3 h-2 w-full accent-[#1746A2]"
                    />
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f4f7fc] p-6">
                <h3 className="font-semibold">A home for your first Group</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b7280]">
                  Your Organization starts with its own identity and settlement
                  setup. No sample participation has been added to your
                  application. Open Groups & setup to prepare the first Cycle.
                </p>
              </div>
            )}
          </OrganizationSection>
          {activity.payouts.length > 0 && (
            <OrganizationSection
              title="Payout outlook"
              description="Retained sample payout coordination records. These are separate from contributions and provider settlement."
            >
              <div className="space-y-5">
                {activity.payouts.map((payout) => (
                  <article
                    key={payout.id}
                    className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e5eaf2] pb-5 last:border-0 last:pb-0"
                  >
                    <div>
                      <h3 className="text-sm font-semibold">
                        {payout.recipient}
                      </h3>
                      <p className="mt-1 text-xs leading-6 text-[#6b7280]">
                        {payout.groupName}
                        <br />
                        Sample target: {payout.dueDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {money(payout.amount)}
                      </p>
                      <p className="mt-2 text-xs text-[#785015]">
                        {payout.status === "in-progress"
                          ? "Collection in progress"
                          : payout.status === "upcoming"
                            ? "Upcoming round"
                            : payout.status}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </OrganizationSection>
          )}
          {activity.recent.length > 0 && (
            <OrganizationSection
              title="Community activity"
              description="Relative times are shown as recorded in the historical sample snapshot."
            >
              <ol className="space-y-4">
                {activity.recent.map((event) => (
                  <li key={event.id}>
                    <p className="text-sm leading-6">{event.message}</p>
                    <p className="mt-1 text-xs text-[#6b7280]">
                      {event.time} at snapshot
                    </p>
                  </li>
                ))}
              </ol>
              {activity.pendingJoinRequests > 0 && (
                <p className="mt-5 text-sm text-[#1746A2]">
                  {activity.pendingJoinRequests} sample join requests waiting.
                  Membership decisions follow in Thrift.
                </p>
              )}
            </OrganizationSection>
          )}
          <OrganizationSection title="Recent Organization activity">
            <ol className="space-y-5">
              {organization.history
                .slice(-5)
                .reverse()
                .map((event, index) => (
                  <li key={`${event.at}-${index}`}>
                    <p className="text-sm font-medium">{event.action}</p>
                    <time
                      className="mt-1 block text-xs text-[#6b7280]"
                      dateTime={event.at}
                    >
                      {new Date(event.at).toLocaleString("en-NG")}
                    </time>
                  </li>
                ))}
            </ol>
          </OrganizationSection>
        </div>
        <div className="space-y-6">
          <OrganizationSection title="Readiness & next actions">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold">Business identity</h3>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  Your name, logo and contact details are shared across this
                  Organization context.
                </p>
                <button
                  className="tcs-link mt-2 text-sm"
                  onClick={() => navigate("owner-profile")}
                >
                  Review business profile →
                </button>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Settlement account</h3>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  {pending
                    ? "A change is awaiting independent review. Your current account remains effective."
                    : organization.settlement
                      ? `${organization.settlement.bankName} · ending ${organization.settlement.accountNumber.slice(-4)} · ${organization.settlement.resolvedName}`
                      : "Set up and confirm your business settlement account."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold">New activity</h3>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  {canStartNewActivity(organization)
                    ? "Organization active. Group setup and activation are available in Groups."
                    : "New Group activation and Cycle commencement are unavailable in the current Organization state."}
                </p>
              </div>
            </div>
          </OrganizationSection>
          <OrganizationSection title="Business responsibilities">
            <p className="text-sm leading-7 text-[#6b7280]">
              The Organization remains responsible for its Groups and funds
              settled to it. TCS coordinates records and oversight without
              holding thrift funds. Ordinary provider-confirmed contributions do
              not require Owner approval.
            </p>
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => navigate("owner-settings")}
            >
              Status & lifecycle
            </Button>
          </OrganizationSection>
        </div>
      </div>
    </OwnerShell>
  )
}
