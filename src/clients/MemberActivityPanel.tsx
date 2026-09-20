import { formatDate, formatMoneyMinor } from '../design/format'
import type { MemberActivity } from "./model"
import { activityTotals } from "./seeds"
import { Section } from "./ClientShell"

const money = (amount: number) => formatMoneyMinor(amount * 100)
const date = formatDate

export function MemberActivityPanel({
  activity,
}: {
  activity: MemberActivity
}) {
  const totals = activityTotals(activity)
  const nextPayout = activity.groups
    .filter(
      (group) =>
        !activity.payouts.some((payout) => payout.groupId === group.id),
    )
    .sort((a, b) => a.payoutDate.localeCompare(b.payoutDate))[0]
  const transactions = [
    ...activity.contributions.map((row) => ({
      ...row,
      date: row.paidAt,
      label: "Contribution confirmed",
      detail: "Provider confirmed",
      direction: "contribution",
    })),
    ...activity.payouts.map((row) => ({
      ...row,
      date: row.receivedAt,
      label: "Payout received",
      detail: "Confirmed by recipient",
      direction: "payout",
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--tcs-brand)]">
            YOUR THRIFT AT A GLANCE
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            A clear picture of your participation
          </h2>
        </div>
        <p className="text-sm text-[var(--tcs-text-muted)]">
          Sample activity · {date(activity.asOf)}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Contributions paid",
            value: money(totals.contributed),
            detail: `${activity.contributions.length} confirmed payments`,
          },
          {
            label: "Payouts received",
            value: money(totals.received),
            detail: "Recipient-confirmed transfers",
          },
          {
            label: "Active Groups",
            value: String(totals.groups).padStart(2, "0"),
            detail: `Across ${new Set(activity.groups.map(group => group.organization)).size} Organizations`,
          },
          {
            label: "Next payout position",
            value: nextPayout
              ? `${nextPayout.position} of ${nextPayout.positions}`
              : "—",
            detail: nextPayout
              ? date(nextPayout.payoutDate)
              : "No upcoming payout",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white p-5 shadow-[var(--tcs-shadow-sm)]"
          >
            <p className="text-sm text-[var(--tcs-text-muted)]">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-[var(--tcs-brand-900)]">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-[var(--tcs-text-muted)]">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div id="member-groups" className="scroll-mt-6">
          <Section
            title="My Groups"
            description="Your current Cycles, contributions and payout positions."
          >
            <div className="space-y-5">
              {activity.groups.map((group) => {
                const payout = activity.payouts.find(
                  (row) => row.groupId === group.id,
                )
                const ownRound = group.position === group.round
                return (
                  <article
                    key={group.id}
                    className="rounded-xl border border-[var(--tcs-border)] p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="mt-1 text-sm text-[var(--tcs-text-muted)]">
                          {group.organization}
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--tcs-success-soft)] px-3 py-1 text-sm font-medium text-[var(--tcs-success-700)]">
                        Active Cycle
                      </span>
                    </div>
                    <div className="my-5 flex flex-wrap justify-between gap-3 text-sm">
                      <p>
                        Cycle 1 · Round {group.round} of {group.positions}
                      </p>
                      <p className="font-semibold">
                        {money(group.monthlyContribution)} / month
                      </p>
                    </div>
                    <p className="mb-3 text-sm font-semibold">{ownRound ? "Recipient contribution is optional this Round" : `Contribution due ${date(group.contributionDueDate)}: ${money(group.monthlyContribution)}`}</p>
                    <progress
                      className="h-1.5 w-full accent-[var(--tcs-brand)]"
                      aria-label={`${group.name} contribution rounds paid`}
                      max={group.positions}
                      value={group.paidRounds}
                    />
                    <p className="mt-2 text-sm text-[var(--tcs-text-muted)]">
                      {group.paidRounds} contribution Rounds paid · Position{" "}
                      {group.position}
                    </p>
                    <div className="mt-4 rounded-lg bg-[var(--tcs-brand-subtle)] p-3 text-sm leading-6">
                      {payout ? (
                        <>
                          Your payout of <strong>{money(payout.amount)}</strong>{" "}
                          was confirmed received on {date(payout.receivedAt)}.
                        </>
                      ) : ownRound ? (
                        <>
                          This is your payout Round. Your own contribution is{" "}
                          <strong>optional</strong>; skipping it creates no late
                          payment or penalty.
                        </>
                      ) : (
                        <>
                          Your payout is scheduled for {date(group.payoutDate)}.
                        </>
                      )}
                    </div>
                    <details className="mt-4 text-sm">
                      <summary className="cursor-pointer font-semibold text-[var(--tcs-brand)]">
                        View Group preview
                      </summary>
                      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                        {[
                          {
                            label: "Scheduled Payout Value",
                            value: money(group.scheduledValue),
                          },
                          {
                            label: "Agreed Organization fee at payout",
                            value: money(group.organizationFee),
                          },
                          {
                            label: "Contribution this Round",
                            value: ownRound
                              ? "Optional for the payout recipient"
                              : `${money(group.monthlyContribution)} due ${date(group.contributionDueDate)}`,
                          },
                          {
                            label: "Payout method",
                            value: "Organization bank transfer",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <dt className="text-[var(--tcs-text-muted)]">
                              {item.label}
                            </dt>
                            <dd className="mt-1 font-medium">{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-4 leading-6 text-[var(--tcs-text-muted)]">
                        Scheduled Payout Value remains unchanged if the optional
                        own-Round contribution is skipped. Contributions and
                        payout confirmation are separate records.
                      </p>
                    </details>
                  </article>
                )
              })}
            </div>
          </Section>
        </div>
        <Section
          title="Recent activity"
          description="Contributions and payouts, clearly distinguished."
        >
          <ol className="space-y-5">
            {transactions.slice(0, 5).map((row) => (
              <li
                key={row.id}
                className="border-b border-[var(--tcs-border)] pb-5 last:border-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{row.label}</p>
                    <p className="mt-1 text-sm text-[var(--tcs-text-muted)]">
                      {
                        activity.groups.find(
                          (group) => group.id === row.groupId,
                        )?.name
                      }
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      row.direction === "payout"
                        ? "text-[var(--tcs-success-700)]"
                        : "text-[var(--tcs-text)]"
                    }`}
                  >
                    {money(row.amount)}
                  </p>
                </div>
                <p className="mt-3 text-sm text-[var(--tcs-text-muted)]">
                  {date(row.date)} · {row.detail}
                </p>
                <p className="mt-1 break-all text-xs text-[var(--tcs-text-muted)]">
                  {row.reference}
                </p>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  )
}
