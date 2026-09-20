import { requireBusinessReportAccess } from '../reports/permissions.ts'
import { recoveryBalances } from '../lifecycle/recovery.ts'
import { recoveryRestriction } from './restrictions.ts'
import { payoutTotals } from '../payouts/math.ts'
import { locateReview } from './locate.ts'
﻿import { fullName, type Client } from "../clients/model.ts"
import type { Organization } from "../organizations/model.ts"
import type { ThriftGroup } from "../groups/model.ts"
import type {
  ReconciliationState,
  FinanceCase,
} from "../reconciliation/model.ts"
import {
  money,
  human,
  requireInternal,
  type InternalSession,
  type OperationsCase,
  type Triage,
  type CaseEvent,
  type ContextField,
  type Evidence,
} from "./model.ts"
export interface OperationsSources {
  clients: Client[]
  organizations: Organization[]
  worlds: { groups: ThriftGroup[]; finance?: ReconciliationState }[]
}
const field = (label: string, value: unknown): ContextField => ({
  label,
  value:
    value === undefined || value === null || value === ""
      ? "Not recorded"
      : String(value),
})
const amount = (label: string, value?: number) =>
  field(label, value === undefined ? undefined : money(value))
const events = (
  history: {
    at: string
    actor?: string
    action: string
    reason?: string
    before?: unknown
    after?: unknown
  }[],
): CaseEvent[] =>
  history.map((h) => ({
    at: h.at,
    actor: h.actor || "Member",
    action: h.action,
    reason: h.reason,
    before: typeof h.before === "string" ? human(h.before) : undefined,
    after: typeof h.after === "string" ? human(h.after) : undefined,
    origin: "Source",
  }))
const files = (
  ...values: (File | { name: string; file?: File } | null | undefined)[]
): Evidence[] =>
  values
    .filter((v): v is File | { name: string; file?: File } => !!v)
    .map((v) => ({
      name: v.name,
      file:
        typeof File !== "undefined" && v instanceof File
          ? v
          : "file" in v
            ? v.file
            : undefined,
    }))
function reference(id: string) {
  let hash = 2166136261
  for (const char of id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return "OPS-" + (hash >>> 0).toString(16).toUpperCase().padStart(8, "0")
}
export function projectCases(
  sources: OperationsSources,
  session: InternalSession | null,
  triage: Record<string, Triage> = {},
): OperationsCase[] {
  requireInternal(session)
  return buildCases(sources, triage)
}
export function projectReportingCases(sources: OperationsSources, session: InternalSession | null, triage: Record<string, Triage> = {}): OperationsCase[] {
  requireBusinessReportAccess(session)
  return buildCases(sources, triage)
}
function buildCases(sources: OperationsSources, triage: Record<string, Triage>): OperationsCase[] {
  const result = new Map<string, OperationsCase>()
  const name = (id?: string, group?: ThriftGroup) =>
    sources.clients.find((c) => c.id === id)
      ? fullName(sources.clients.find((c) => c.id === id)!)
      : group?.cycles.flatMap((c) => c.participants).find((p) => p.id === id)
          ?.name || id
  const add = (
    input: Pick<OperationsCase, "id" | "type" | "module" | "reason" | "createdAt" | "sourceStatus" | "source"> & Partial<OperationsCase>,
  ) => {
    const sourceGroup = sources.worlds
      .flatMap((w) => w.groups)
      .find(
        (g) =>
          g.id === input.groupId && g.organizationId === input.organizationId,
      )
    input.referenceAt =
      sourceGroup?.payouts?.referenceAt ||
      sourceGroup?.cycles.find((c) => c.id === input.cycleId)?.active
        ?.referenceAt ||
      input.createdAt
    const t = triage[input.id]
    const resolved = input.status === "Resolved" || input.status === "Closed"
    const c: OperationsCase = {
      category: "Reviews",
      priority: "Normal",
      status: "New",
      context: [],
      financial: [],
      evidence: [],
      timeline: [],
      policy:
        "Constitution v0.3 · Chapters 24–26: controlled review and retained history.",
      nextAction:
        "Inspect evidence and prepare for the later controlled decision workflow.",
      ...input,
      reference: reference(input.id),
    }
    if (t) {
      c.assignee = t.assignee
      c.priority = t.priority || c.priority
      if (!resolved) c.status = t.status || c.status
    }
    c.evidence = c.evidence.sort((a,b) => Number(!!b.file)-Number(!!a.file))
    c.timeline = [
      ...c.timeline,
      {
        at: c.createdAt,
        actor: "TCS automatic handoff",
        action: "Source entered Operations review scope",
        origin: "Source" as const,
      },
      ...(t?.timeline || []),
    ]
      .filter(
        (e, i, all) =>
          all.findIndex((o) => JSON.stringify(o) === JSON.stringify(e)) === i,
      )
      .sort((a, b) => a.at.localeCompare(b.at))
    if (resolved)
      c.resolvedAt ||= c.timeline.filter((e) => e.origin === "Source").at(-1)
        ?.at
    if (c.status === "Awaiting Information")
      c.nextAction =
        "Await the requested information. Request is recorded internally; no message has been sent."
    if (c.status === "Escalated")
      c.nextAction =
        "Supervisor triage required; no product or financial decision has been executed."
    if (resolved) c.nextAction = "Source outcome retained in read-only history."
    result.set(c.id, c)
  }
  for (const member of sources.clients) {
    const v = member.verification
    if (v.submittedAt || ["pending", "information-required"].includes(v.status))
      add({
        id: `client:${member.id}:verification:${v.submittedAt || "submission"}`,
        type: "Member KYC Review",
        module: "Clients",
        memberId: member.id,
        member: fullName(member),
        createdAt: v.submittedAt || member.history[0]?.at || "",
        sourceStatus: human(v.status),
        reason: v.note || "Verification submission requires internal review.",
        status: ["verified", "rejected"].includes(v.status)
          ? "Resolved"
          : v.status === "information-required"
            ? "Awaiting Information"
            : "New",
        source: {
          id: member.id,
          label: "View Member verification",
          kind: "Member verification",
        },
        context: [
          field("Member", fullName(member)),
          field("Email", member.profile.email),
          field("Account status", human(member.accountStatus)),
          field("Verification", human(v.status)),
          field("Submitted", v.submittedAt),
          field("Submission address", v.submission?.profile.address),
          field("Submitted identity number",v.submission?.nin),
          field("Submitted date of birth",v.submission?.profile.dob),
          field("Submitted name",v.submission?[v.submission.profile.firstName,v.submission.profile.middleName,v.submission.profile.lastName].filter(Boolean).join(" "):undefined),
        ],
        evidence: [
          ...(v.submission?.documents || []).map((doc) => ({
            name: doc,
            detail: "Submitted document reference",
          })),
          ...files(...(v.responses||[]).map(r=>r.document)),
          ...files(
            member.identity.ninDocument,
            member.identity.addressDocument,
          ),
        ],
        timeline: [...events(member.history),...(v.responses||[]).map(r=>({at:r.at,actor:"Member",action:"Verification information received",reason:r.text,origin:"Source" as const}))],
        policy:
          "Constitution v0.3 · Chapters 2, 20, 24: internal verification review; essential Member activity remains available.",
      })
    if (
      ["restricted", "suspended"].includes(member.accountStatus) &&
      member.restrictionReason
    )
      add({
        id: `client:${member.id}:restriction`,
        type: "Member Restriction Review",
        module: "Clients",
        memberId: member.id,
        member: fullName(member),
        createdAt: member.history.at(-1)?.at || "",
        sourceStatus: human(member.accountStatus),
        reason: member.restrictionReason || member.interventionReview?.publicMessage || "Controlled Member activity review",
        source: {
          id: member.id,
          label: "View Member restriction",
          kind: "Member restriction",
        },
        context: [
          field("Restriction", member.restrictionReason),
          field("Next step", member.restrictionNextAction),
        ],
        timeline: events(member.history),
      })
  }
  for (const org of sources.organizations) {
    const base = {
      organizationId: org.id,
      organization: org.form.name,
      memberId: org.ownerMemberId,
      member: name(org.ownerMemberId),
      module: "Organizations" as const,
    }
    if (org.application.submittedAt && org.status !== "draft")
      add({
        ...base,
        id: `org:${org.id}:application`,
        type: "Organization Application Review",
        createdAt: org.application.submittedAt,
        sourceStatus: human(org.status),
        reason:
          org.application.note ||
          "Organization application submitted for internal review.",
        status: ["submitted", "pending", "information-required"].includes(
          org.status,
        )
          ? org.status === "information-required"
            ? "Awaiting Information"
            : "New"
          : "Resolved",
        source: {
          id: org.id,
          label: "View Organization application",
          kind: "Organization application",
        },
        context: [
          field(
            "Applicant / Owner",
            org.application.ownerSnapshot?.name || name(org.ownerMemberId),
          ),
          field("Owner email", org.application.ownerSnapshot?.email),
          field("Organization", org.form.name),
          field("Legal name", org.form.legalName),
          field("Type", org.form.orgType),
          field("Registration", org.form.registration),
          field("Address", org.form.address),
          field("Submitted purpose", org.application.snapshot?.whyDigitize),
          field("Description", org.application.snapshot?.description),
          field("Settlement bank", org.settlement?.bankName),
          field(
            "Settlement account",
            org.settlement
              ? `${org.settlement.resolvedName} · ${org.settlement.accountNumber}`
              : undefined,
          ),
        ],
        evidence: files(
          org.application.snapshot?.supportingDocs,
          org.application.snapshot?.existingRecords,
          ...org.application.responses.map((r) => r.document),
        ),
        timeline: [
          ...events(org.history),
          ...org.application.responses.map((r) => ({
            at: r.at,
            actor: "Organization Owner",
            action: "Information response received",
            reason: r.text,
            origin: "Source" as const,
          })),
        ],
      })
    for (const change of org.settlementChanges)
      add({
        ...base,
        id: `org:${org.id}:settlement:${change.id}`,
        type: "Settlement Account Change Review",
        createdAt: change.requestedAt,
        sourceStatus: human(change.status),
        status: change.status === "approved" ? "Resolved" : "New",
        reason: change.reason,
        source: {
          id: change.id,
          label: "View settlement-account request",
          kind: "Settlement account change",
        },
        context: [
          field(
            "Current account",
            `${change.previous.bankName} · ${change.previous.accountNumber} · ${change.previous.resolvedName}`,
          ),
          field(
            "Proposed account",
            `${change.proposed.bankName} · ${change.proposed.accountNumber} · ${change.proposed.resolvedName}`,
          ),
        ],
        timeline: events(org.history),
        policy:
          "Constitution v0.3 · §9.9: controlled validation, authorization, provider update and audit.",
      })
    if (["suspended", "closure-pending", "closed"].includes(org.status) || org.interventionReview)
      add({
        ...base,
        id: `org:${org.id}:lifecycle`,
        type:
          (org.status === "suspended" || !!org.interventionReview)
            ? org.interventionReview?.state.toLowerCase().includes("incapacity") || org.interventionReview?.state.includes("Legal") ? "Legal / Compliance Review" : "Organization Suspension Review"
            : "Organization Closure Review",
        createdAt: org.closureRequestedAt || org.history.at(-1)?.at || "",
        sourceStatus: human(org.status),
        status: org.status === "closed" ? "Closed" : "New",
        reason:
          org.application.note ||
          "Controlled Organization lifecycle review is required.",
        source: {
          id: org.id,
          label: "View Organization lifecycle",
          kind: "Organization lifecycle",
        },
        context: Object.entries(org.clearance || {}).map(([k, v]) =>
          field(human(k.replace(/([A-Z])/g, " $1")), v),
        ),
        timeline: events(org.history),
      })
  }
  for (const world of sources.worlds) {
    const s = world.finance
    // Never join a financial record to a Group from another tenant.
    for (const g of world.groups)
      if (s && g.organizationId !== s.organizationId)
        throw Error("Operations source tenant mismatch.")
    const groups = world.groups
    const financeCases: FinanceCase[] = s?.cases || []
    for (const f of financeCases) {
      if (f.organizationId !== s!.organizationId)
        throw Error("Operations case tenant mismatch.")
      const org = sources.organizations.find((o) => o.id === f.organizationId)
      if (!org) continue
      const g = groups.find(
        (g) => g.id === f.groupId && g.organizationId === f.organizationId,
      )
      if (f.groupId && !g) continue
      const payout = g?.payouts?.records.find((p) => p.id === f.payoutId)
      const recovery = g?.lifecycle?.recoveries.find(
        (r) => r.id === f.lifecycleId,
      )
      const exit = g?.lifecycle?.exits.find((e) => e.id === f.lifecycleId)
      // Ordinary exit settlement timing is not an Operations exception.
      if (
        f.kind === "exit" &&
        !exit?.settlement.escalatedAt &&
        f.status !== "resolved"
      )
        continue
      // Revenue payment cases are represented once, directly by their receivable below.
      if (f.kind === "revenue-share") continue
      const transaction = g?.payments?.transactions.find(
        (t) => t.id === f.transactionId,
      )
      const manual = g?.manualContributions?.find(
        (m) => m.id === f.transactionId,
      )
      const attempt = g?.payments?.attempts.find(
        (a) => a.id === transaction?.attemptId,
      )
      const batch = s!.settlements.find((b) => b.id === f.settlementId)
      const cycle = g?.cycles.find((c) => c.id === f.cycleId)
      const titles: Record<FinanceCase["kind"], string> = {
        "fee-adjustment": "Fee / Revenue Share Adjustment Required",
        "revenue-share": "TCS Revenue Share — Awaiting Confirmation",
        "amount-mismatch": "Amount Mismatch",
        unallocated: "Unallocated Payment",
        advance: "Advance Payment Exception",
        "late-optional": "Late Optional Contribution",
        settlement:
          batch?.status === "variance"
            ? "Settlement Variance"
            : "Settlement Exception",
        manual: "Manual Contribution Review",
        duplicate: "Payment Exception",
        payout: payout?.disputes.length
          ? "Payout Dispute"
          : payout?.breach
            ? "Organization Payout Breach"
            : "Payout Exception",
        recovery: "Post-Payout Recovery",
        exit: "Exit Settlement Breach",
      }
      const context: ContextField[] = [
        field("Source issue status", human(f.status)),
      ]
      if (g)
        context.push(
          field("Group", g.name),
          field(
            "Cycle",
            cycle
              ? `Cycle ${cycle.number} · ${human(cycle.status)}`
              : f.cycleId,
          ),
        )
      if (f.roundId)
        context.push(
          field(
            "Round",
            cycle?.active?.rounds.findIndex((r) => r.id === f.roundId)! + 1 ||
              f.roundId,
          ),
        )
      if (f.obligationId)
        context.push(field("Related obligation", f.obligationId))
      const financial: ContextField[] = [],
        evidence: Evidence[] = files(f.evidence),
        timeline = events(f.history)
      let sourceStatus = human(f.status),
        resolved = f.status === "resolved"
      if (transaction) {
        sourceStatus = `${human(transaction.status)} · ${human(transaction.allocationStatus)}`
        financial.push(
          amount("Member / provider confirmed", transaction.amountMinor),
          amount("Expected contribution", attempt?.expectedMinor),
          amount("Obligation allocated", transaction.allocatedMinor),
          amount("Unallocated", transaction.unallocatedMinor),
        )
        context.push(
          field("Payment reference", transaction.providerReference),
          field("Provider", transaction.provider),
          field("Confirmed at", transaction.confirmedAt),
          field("Automatic treatment", f.reason),
        )
        evidence.push({
          name: transaction.providerReference,
          detail: "Provider confirmation reference",
        })
        timeline.push({
          at: transaction.confirmedAt,
          actor: transaction.provider,
          action: "Payment confirmed",
          origin: "Source",
        })
      }
      const unmatched = s!.unmatchedPayments.find(
        (p) => p.providerReference === f.sourceReference,
      )
      if (unmatched) {
        financial.push(
          amount("Provider confirmed", unmatched.amountMinor),
          amount("Allocated", 0),
          amount("Unallocated", unmatched.amountMinor),
        )
        context.push(
          field("Provider reference", unmatched.providerReference),
          field("Confirmed at", unmatched.confirmedAt),
        )
        evidence.push({
          name: unmatched.providerReference,
          detail: "Unmatched provider confirmation",
        })
      }
      if (manual) {
        sourceStatus = human(manual.status)
        financial.push(
          amount("Organization recorded", manual.amountMinor),
          amount("Allocated", manual.allocatedMinor),
        )
        context.push(
          field("Channel", human(manual.channel)),
          field("Recorded by", manual.actorId),
          field("Transfer reference", manual.reference),
          field("Paid at", manual.paidAt),
          field(
            "Provider confirmation",
            "Not provider-confirmed; manual/offline evidence only",
          ),
        )
        evidence.push(...files(manual.evidence))
      }
      if (batch) {
        sourceStatus = human(batch.status)
        const matched = groups
          .flatMap((g) => g.payments?.transactions || [])
          .filter((t) => batch.matchedTransactionIds.includes(t.id))
        const expectedNet = batch.netMinor - batch.varianceMinor
        financial.push(
          amount("Provider batch gross", batch.grossMinor),
          amount(
            "Matched Member payments",
            matched.reduce((n, t) => n + t.amountMinor, 0),
          ),
          amount(
            "Obligation allocated",
            matched.reduce((n, t) => n + t.allocatedMinor, 0),
          ),
          amount(
            "Expected provider fee / reconciliation basis",
            batch.grossMinor - expectedNet - batch.otherDeductionsMinor,
          ),
          amount("Reported provider fee", batch.processingFeeMinor),
          amount("Other deductions", batch.otherDeductionsMinor),
          amount("Expected settlement / reconciliation basis", expectedNet),
          amount("Actual settlement", batch.netMinor),
          amount("Variance (actual minus expected)", batch.varianceMinor),
        )
        context.push(
          field("Settlement reference", batch.reference),
          field(
            "Destination",
            `${batch.destination.bankName} · ${batch.destination.accountNumber}`,
          ),
          field("Provider", batch.provider),
          field("Settled at", batch.settledAt),
          field("Matched payments", matched.length),
          field(
            "Reconciliation basis",
            batch.lines.every((l) =>
              s!.expectations.some(
                (e) =>
                  e.providerReference === l.providerReference &&
                  e.expectedFeeMinor !== undefined,
              ),
            )
              ? "Configured demo expected provider cost"
              : "Reported provider deductions; expected provider cost unavailable",
          ),
        )
        evidence.push(
          { name: batch.reference, detail: "Provider settlement reference" },
          ...batch.lines.map((l) => ({
            name: l.providerReference,
            detail: "Settlement line · " + money(l.grossMinor),
          })),
        )
        timeline.push(...events(batch.history))
      }
      if(f.adjustment){for(const [key,value] of Object.entries(f.adjustment))financial.push(field(human(key.replace(/([A-Z])/g," $1")),typeof value==='number'?money(value):value))}
      if (payout) {
        sourceStatus = human(payout.status)
        financial.push(amount("Evidenced / undisputed receipt",payoutTotals(payout).received),amount("Scheduled payout entitlement",payout.calculation?.entitlementMinor))
        const paid = payout.installments.reduce((n, i) => n + i.amountMinor, 0)
        financial.push(
          amount(
            "Scheduled payout value",
            payout.calculation?.scheduledValueMinor,
          ),
          amount("Expected net payout", payout.calculation?.netMinor),
          amount("Organization recorded", paid),
          amount(
            "Outstanding",
            payout.calculation
              ? Math.max(0, payout.calculation.netMinor - paid)
              : undefined,
          ),
          amount("Organization Fee", payout.calculation?.feeMinor),
        )
        context.push(
          field("Responsibility", "Organization"),
          field("Organization breach", payout.breach?.status==='open'?'Open':payout.breach?'Resolved':'Not recorded'),
          field("Breach due at", payout.breach?.dueAt),
          field("Beneficiary", payout.beneficiaryName),
          field("Position", payout.position),
          field("Payout target", payout.targetAt),
        )
        for (const i of payout.installments) {
          context.push(
            field(
              "Transfer / beneficiary snapshot",
              `${i.reference} · ${money(i.amountMinor)} · ${i.bank.bankName} · ${i.bank.accountNumber} · ${i.bank.resolvedName}`,
            ),
            field("Transfer time / response", `${i.at} · ${human(i.status)}`),
          )
          if (i.partial)
            context.push(
              field("Partial payout completion plan", i.completionPlan),
            )
          evidence.push(...files(i.evidence), {
            name: i.reference,
            detail: "Organization transfer reference",
          })
          timeline.push({
            at: i.recordedAt,
            actor: i.actorId,
            action: "Organization recorded payout installment",
            reason: `${money(i.amountMinor)} · ${i.reference}`,
            origin: "Source",
          })
        }
        for (const d of payout.disputes)
          timeline.push({
            at: d.at,
            actor: name(d.memberId, g) || d.memberId,
            action: "Member disputed payout",
            reason: d.reason,
            origin: "Source",
          })
      }
      if (recovery) {
        sourceStatus = human(recovery.status)
        resolved = recovery.status === "resolved"
        financial.push(
          amount("Principal liability", recovery.principalMinor),
          amount("Accrued penalty", recovery.penaltyMinor),
          amount("Amount recovered", recovery.recoveredMinor),
          amount(
            "Outstanding",
            recoveryBalances(recovery).outstanding,
          ),
        )
        context.push(
          field("Responsibility", "Member"),
          field(
            "New commitments restricted",
            recovery.restricted ? "Yes" : "No",
          ),
          field("Recovery review", human(recovery.reviewStatus)),
          field("Default history", "Post-Payout Default retained; existing commitments continue"),
          field("Recovery allocation", "Principal first, then penalty"),
          amount("Outstanding principal",recoveryBalances(recovery).principalOutstanding),
          amount("Outstanding penalty",recoveryBalances(recovery).penaltyOutstanding),
          amount("Excess recovery requiring review",recoveryBalances(recovery).excessMinor),
        )
        timeline.push(...events(g!.history))
      }
      if (exit) {
        sourceStatus = human(exit.settlement.status)
        resolved = exit.settlement.status === "resolved"
        financial.push(
          amount("Recognized contributions", exit.recognizedContributionsMinor),
          amount("Exit settlement due", exit.settlement.dueMinor),
          amount("Evidenced settled", (exit.settlementConfirmations||[]).reduce((n,r)=>n+r.amountMinor,0)),
        )
        context.push(
          field("Responsibility", "Organization"),
          field("Settlement timing", human(exit.settlement.timing)),
          field("Due at", exit.settlement.dueAt),
        )
        timeline.push(...events(g!.history))
      }
      add({
        disputeProcesses: f.kind==='fee-adjustment'?undefined:payout?.disputes,
        id: `finance:${f.organizationId}:${f.id}`,
        type: titles[f.kind],
        module: ["recovery", "exit"].includes(f.kind) ? "Thrift" : "Payments",
        category: ["payout", "recovery", "exit"].includes(f.kind)
          ? "Disputes / Escalations"
          : "Financial Exceptions",
        organizationId: f.organizationId,
        organization: org.form.name,
        memberId: f.memberId,
        member: name(f.memberId, g),
        groupId: f.groupId,
        cycleId: f.cycleId,
        roundId: f.roundId,
        amountMinor: recovery
          ? recoveryBalances(recovery).outstanding
          : payout && f.kind!=='fee-adjustment' ? payoutTotals(payout).outstanding : f.amountMinor,
        reason: recovery?.reason || f.reason,
        createdAt:
          recovery?.openedAt || exit?.settlement.escalatedAt || f.createdAt,
        sourceStatus,
        status: resolved
          ? "Resolved"
          : f.status === "escalated"
            ? "Escalated"
            : f.status === "under-review"
              ? "In Review"
              : "New",
        priority: ["payout", "recovery", "exit", "settlement"].includes(f.kind)
          ? "High"
          : "Normal",
        related: {
          paymentId: f.transactionId,
          settlementId: f.settlementId,
          payoutId: f.payoutId,
          lifecycleId: f.lifecycleId,
          obligationId: f.obligationId,
        },
        source: {
          id:
            f.payoutId ||
            f.settlementId ||
            f.lifecycleId ||
            f.transactionId ||
            f.id,
          label: payout
            ? "View Payout"
            : batch
              ? "View Settlement"
              : recovery
                ? "View Recovery"
                : exit
                  ? "View Exit Settlement"
                  : "View Payment",
          kind: titles[f.kind],
        },
        context,
        financial,
        evidence,
        timeline,
        policy: `Constitution v0.3 · ${
          recovery
            ? "Chapter 15: liabilities remain; recovery does not erase history."
            : exit
              ? "§14.8: Organization remains responsible for exit settlement."
              : payout
                ? "Chapters 10, 11, 17, 22: Organization transfers; Member confirms/disputes; no automatic Corestack reimbursement."
                : "Chapter 9: payment, allocation and settlement remain distinct; corrections require controlled treatment."
        }`,
      })
    }
    for (const r of s?.receivables || []) {
      if (r.organizationId !== s!.organizationId)
        throw Error("Revenue source tenant mismatch.")
      if (!r.payments.length) continue
      const org = sources.organizations.find((o) => o.id === r.organizationId),
        g = groups.find(
          (g) => g.id === r.groupId && g.organizationId === r.organizationId,
        )
      if (!org || !g) continue
      const financial = [
          amount("TCS amount due", r.amountMinor),
          amount("Organization Fee recognized", r.organizationFeeMinor),
        ],
        context = [
          field("Group", g.name),
          field("Commercial status", human(r.status)),
          field("TCS payment reference", r.paymentReference),
        ],
        evidence: Evidence[] = []
      for (const p of r.payments) {
        financial.push(
          amount("Organization amount recorded", p.amountMinor),
          amount("Bank charge (Organization expense)", p.bankChargeMinor),
          amount(
            "Mismatch (recorded minus due)",
            p.amountMinor - r.amountMinor,
          ),
        )
        context.push(
          field(
            "Corestack account snapshot",
            `${p.account.bankName} · ${p.account.accountName} · ${p.account.accountNumber}`,
          ),
          field("Organization bank reference", p.bankReference),
          field("Transferred at", p.transferredAt),
          field("Recorded by / at", `${p.recordedBy} · ${p.recordedAt}`),
        )
        evidence.push(...files(p.evidence), {
          name: p.bankReference,
          detail: "Organization transfer reference",
        })
      }
      add({
        id: `revenue:${r.organizationId}:${r.id}`,
        type:
          r.paymentStatus === "exception"
            ? "TCS Revenue Share Payment Exception"
            : "TCS Revenue Share — Awaiting Confirmation",
        module: "Payments",
        category: "Financial Exceptions",
        organizationId: r.organizationId,
        organization: org.form.name,
        groupId: r.groupId,
        cycleId: r.cycleId,
        amountMinor: r.amountMinor,
        createdAt: r.payments[0].recordedAt,
        sourceStatus: human(r.paymentStatus),
        status: r.paymentStatus === "settled" ? "Resolved" : "New",
        reason:
          r.paymentStatus === "exception"
            ? "Recorded payment differs from the exact TCS amount due."
            : "Organization recorded a transfer. Authorized TCS receipt confirmation remains outstanding.",
        related: { paymentId: r.payments[0]?.id, payoutId: r.payoutId },
        source: {
          id: r.id,
          label: "View Revenue Share payment",
          kind: "Revenue Share payment",
        },
        context,
        financial,
        evidence,
        timeline: events(r.history),
        policy:
          "Constitution v0.3 · §12.7–12.8: recording does not settle the obligation or remove restrictions. Only authorized TCS confirmation can establish receipt.",
        nextAction:
          "Inspect transfer evidence and prepare for authorized confirmation in Module 5B.",
      })
    }
    for (const g of groups) {
      const org = sources.organizations.find((o) => o.id === g.organizationId)
      if (!org) continue
      const base = {
        organizationId: org.id,
        organization: org.form.name,
        groupId: g.id,
        module: "Thrift" as const,
        timeline: events(g.history),
      }
      const lifecycle = g.lifecycle
      if (!lifecycle) continue
      const contextFor = (cycleId: string) => {
        const c = g.cycles.find((c) => c.id === cycleId)
        return [
          field("Group", g.name),
          field(
            "Cycle",
            c ? `Cycle ${c.number} · ${human(c.status)}` : cycleId,
          ),
          field(
            "Current contribution",
            c ? money(c.terms.amount * 100) : undefined,
          ),
          field("Frequency", c?.terms.frequency),
          field("Affected positions", c?.positions.length),
          field("Generated obligations", c?.active?.obligations.length),
          field(
            "Unresolved recoveries",
            lifecycle.recoveries.filter(
              (r) => r.status !== "resolved" && r.cycleId === cycleId,
            ).length,
          ),
          field(
            "Open disputes",
            lifecycle.disputes.filter(
              (d) => d.status === "open" && d.cycleId === cycleId,
            ).length,
          ),
        ]
      }
      for (const a of lifecycle.amendments)
        add({
          ...base,
          id: `thrift:${org.id}:${a.id}`,
          type: "Cycle Amendment Request",
          cycleId: a.cycleId,
          createdAt: a.requestedAt,
          sourceStatus: human(a.status),
          status:
            a.status === "awaiting-consent"
              ? "Awaiting External Action"
              : "New",
          reason: a.reason,
          source: {
            id: a.id,
            label: "View Cycle Amendment",
            kind: "Cycle amendment",
          },
          context: [
            ...contextFor(a.cycleId),
            field(
              "Affected Members",
              a.affectedMemberIds.map((id) => name(id, g)).join(", "),
            ),
            field(
              "Consents received",
              `${a.consents.length} of ${a.affectedMemberIds.length}`,
            ),
            field("Current contribution", money(a.currentTerms.amount * 100)),
            field("Proposed contribution", money(a.proposedTerms.amount * 100)),
            ...Object.keys(a.currentTerms)
              .filter(
                (k) =>
                  JSON.stringify(
                    a.currentTerms[(k as keyof typeof a.currentTerms)],
                  ) !==
                    JSON.stringify(
                      a.proposedTerms[(k as keyof typeof a.proposedTerms)],
                    ) && k !== "amount",
              )
              .map((k) =>
                field(
                  "Changed term: " + human(k),
                  `${JSON.stringify(a.currentTerms[(k as keyof typeof a.currentTerms)])} → ${JSON.stringify(a.proposedTerms[(k as keyof typeof a.proposedTerms)])}`,
                ),
              ),
          ],
          policy:
            "Constitution v0.3 · Chapter 19: locked terms require controlled amendment, Member consent and audit.",
        })
      for (const f of lifecycle.forceCloseRequests)
        add({
          ...base,
          id: `thrift:${org.id}:${f.id}`,
          type: "Force Close Request",
          cycleId: f.cycleId,
          createdAt: f.requestedAt,
          sourceStatus: human(f.status),
          status: f.status === "approved-demo" ? "Resolved" : "New",
          priority: "High",
          reason: f.reason,
          source: {
            id: f.id,
            label: "View Force Close request",
            kind: "Force Close",
          },
          context: [
            ...contextFor(f.cycleId),
            field(
              "Affected Members",
              f.affectedMemberIds.map((id) => name(id, g)).join(", "),
            ),
            field("Disputes", f.balances.disputes.join(", ")),
            field(
              "Proposed action",
              "Force Close Cycle with explicit Organization absorption request",
            ),
          ],
          financial: [
            amount("Outstanding principal", f.balances.principalMinor),
            amount("Accrued penalties", f.balances.penaltyMinor),
            amount("Unpaid payouts", f.balances.unpaidPayoutMinor),
            amount("Exit settlements", f.balances.exitSettlementMinor),
            amount("Recovery", f.balances.recoveryMinor),
            amount(
              "Requested Organization absorption",
              f.requestedAbsorptionMinor,
            ),
          ],
          evidence: [
            {
              name: f.evidenceReference,
              detail: "Organization evidence reference",
            },
          ],
          policy:
            "Constitution v0.3 · Chapter 16: TCS approval required; Force Close never falsely marks money paid.",
        })
      if (lifecycle.termination)
        add({
          ...base,
          id: `thrift:${org.id}:${g.id}:termination`,
          type: "Group Termination Review",
          createdAt: lifecycle.termination.at,
          sourceStatus: human(lifecycle.termination.status),
          status:
            lifecycle.termination.status === "terminated" ? "Resolved" : "New",
          reason: lifecycle.termination.reason,
          source: {
            id: g.id,
            label: "View Group termination",
            kind: "Group termination",
          },
          context: [
            field("Group", g.name),
            field("Cycles retained", g.cycles.length),
          ],
          policy:
            "Constitution v0.3 · §16.2: terminating the Group is distinct from Force Closing a Cycle.",
        })
      for (const d of lifecycle.disputes) {
        if(g.payouts?.records.some(p=>p.disputes.some(dispute=>d.id===dispute.installmentId+"-dispute"))&&financeCases.some(f=>f.kind==='payout'&&f.groupId===g.id))continue
        if (
          d.kind === "exit-settlement" &&
          financeCases.some(
            (f) =>
              f.kind === "exit" &&
              f.groupId === g.id &&
              f.cycleId === d.cycleId,
          )
        )
          continue
        if (
          d.kind === "organization-payout-breach" &&
          financeCases.some(
            (f) =>
              f.kind === "payout" &&
              f.groupId === g.id &&
              f.cycleId === d.cycleId,
          )
        )
          continue
        add({
          ...base,
          id: `thrift:${org.id}:${d.id}`,
          type:
            d.kind === "exit-settlement"
              ? "Exit Settlement Breach"
              : d.kind === "organization-payout-breach"
                ? "Organization Payout Breach"
                : "Lifecycle Escalation",
          category: "Disputes / Escalations",
          createdAt: g.history.at(-1)?.at || "",
          sourceStatus: human(d.status),
          status: d.status === "resolved" ? "Resolved" : "New",
          priority: "High",
          reason: d.reason,
          cycleId: d.cycleId,
          source: {
            id: d.id,
            label: "View lifecycle dispute",
            kind: "Lifecycle dispute",
          },
          context: contextFor(d.cycleId),
        })
      }
    }
  }
  for(const c of result.values()){
    const x=locateReview(sources,c),review=x.target?.review
    const restrictions=[...(x.member?.restrictions||[]),...(x.org?.restrictions||[]),...(x.recovery&&x.group?(x.recovery.restrictions||[recoveryRestriction(x.group,x.recovery)]):[])].filter(r=>r.sourceCaseId===c.id)
    for(const r of restrictions){c.context.push(field("Restriction scope",r.scope),field("Restriction review",r.reviewStatus));c.timeline.push({at:r.startedAt,actor:r.authority,action:r.type+" restriction",reason:r.reason,origin:"Source"});if(r.releasedAt)c.timeline.push({at:r.releasedAt,actor:r.releasedBy||"TCS",action:"Applicable restriction released",reason:r.removalReason,origin:"Source"})}
    const requests=[...(review?.evidenceRequests||[]),...(x.payout?.disputes.flatMap(d=>d.process?.requests||[])||[])]
    for(const r of requests){c.context.push(field("Evidence request to "+r.party,r.requested),field("Evidence deadline",r.deadline),field("Deadline outcome",r.missedAt?"Missed deadline recorded":r.responses.length?"Response received":"Awaiting response"));for(const response of r.responses){c.evidence.push(...response.evidence.map(name=>({name,detail:r.party+" response"})));c.timeline.push({at:response.at,actor:r.party,action:"Evidence response",reason:response.statement,origin:"Source"})}}
    for(const d of x.payout?.disputes||[]){if(!d.process)continue;c.context.push(field("Dispute stage",d.process.stage),field("Appeal deadline",d.process.appealDeadline),field("Finalized",d.process.finalizedAt));for(const r of d.process.resolutions)c.evidence.push(...r.evidence.map(name=>({name,detail:"Resolution evidence"})))}

    if(!review)continue
    c.review=review
    c.sourceStatus=review.state
    c.status=review.caseStatus
    const latest=review.decisions.at(-1)
    c.referenceAt=[c.referenceAt,latest?.at].filter((v):v is string=>!!v).sort().at(-1)
    if(['Resolved','Closed'].includes(c.status))c.resolvedAt=x.account?.effectiveAt||x.amendment?.effectiveAt||latest?.at
    c.timeline.push(...review.decisions.map(d=>({at:d.at,actor:d.reviewerName,action:d.action+' ? '+d.id,reason:d.effect,origin:'Source' as const})))
    c.timeline.sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))
    c.nextAction=review.caseStatus==='Resolved'?'Decision complete; source outcome retained.':review.publicMessage || review.state
  }
  return [...result.values()]
}
