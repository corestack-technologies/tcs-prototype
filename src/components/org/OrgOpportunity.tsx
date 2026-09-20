import { Button } from "../ui"
import { ClientShell } from "../../clients/ClientShell"
import { useClient } from "../../clients/ClientContext"
import { useOrganization } from "../../organizations/OrganizationContext"
import { canApply, hasWorkspace } from "../../organizations/model"
import { OrganizationBrand } from "../../organizations/OrganizationBrand"
import {
  OrganizationScenarios,
  OrganizationStatusChip,
} from "../../organizations/OrganizationUI"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (v: View, meta?: NavMeta) => void
}

const benefits = [
  {
    icon: "📋",
    title: "Verified contribution records",
    body: "Provider-confirmed contributions and separate settlement records create a shared view for your Members. Ordinary successful payments do not need Owner approval.",
  },
  {
    icon: "💳",
    title: "Secure digital collections",
    body: "Member contributions are processed through a secure digital payment provider and settled directly into your organization's designated settlement account. TCS coordinates — your organization controls the funds.",
  },
  {
    icon: "🔔",
    title: "Contribution reminders",
    body: "Members receive reminders ahead of each round's due date, reducing the time you spend following up manually.",
  },
  {
    icon: "📊",
    title: "Full transparency",
    body: "Every member can see the contribution schedule, their assigned position, and the verification status of each round. No information asymmetry.",
  },
  {
    icon: "🏦",
    title: "Structured payout tracking",
    body: "Payout positions are set and agreed before the cycle begins. Transparent records significantly reduce disputes by giving every member the same view of the data.",
  },
  {
    icon: "📈",
    title: "Built to grow",
    body: "Start with one group. Add more cycles and groups as your community grows. TCS scales with your organization.",
  },
]

const responsibilities = [
  "Create and configure thrift groups within your organization",
  "Approve or decline member join requests",
  "Coordinate contributions and resolve permitted exceptions",
  "Record payouts and track recipient confirmation",
  "Maintain group rules and cycle integrity",
  "Communicate with members about schedule changes",
]

const steps = [
  {
    step: "01",
    title: "Apply",
    body: "Complete a short application about your thrift operations and goals.",
  },
  {
    step: "02",
    title: "Review",
    body: "TCS independently reviews your application and may request more information.",
  },
  {
    step: "03",
    title: "Approved",
    body: "Complete Organization profile and settlement setup after approval.",
  },
  {
    step: "04",
    title: "Launch",
    body: "Enter your branded workspace. Group and Cycle tools follow in the Thrift module.",
  },
]

export function OrgOpportunity({ navigate }: Props) {
  const { client } = useClient()
  const { organization, startApplication } = useOrganization()
  if (!client) return null
  const eligible = canApply(client)
  const enter = () => {
    if (!organization) {
      startApplication()
      navigate("org-application")
      return
    }
    navigate(
      organization.status === "draft"
        ? "org-application"
        : organization.status === "approved"
          ? "org-activation"
          : hasWorkspace(organization)
            ? "owner-dashboard"
            : "org-review",
    )
  }
  const action = organization
    ? organization.status === "draft"
      ? "Continue application"
      : organization.status === "approved"
        ? "Complete Organization setup"
        : hasWorkspace(organization)
          ? "Enter Organization workspace"
          : "View application status"
    : "Start my Organization"
  return (
    <ClientShell navigate={navigate} active="organization">
      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
          <OrganizationScenarios navigate={navigate} />
        </div>
        {organization && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-6">
            <OrganizationBrand form={organization.form} />
            <OrganizationStatusChip organization={organization} />
          </div>
        )}
        {!eligible && !organization && (
          <p className="mb-5 text-sm">
            Your Member account must be verified and eligible for new activity.{" "}
            <button
              className="tcs-link"
              onClick={() => navigate("client-verification")}
            >
              View Member verification
            </button>
          </p>
        )}
        {/* Hero */}
        <div className="rounded-3xl bg-[#1746A2] text-white px-6 lg:px-12 py-14">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] inline-block" />
              {organization
                ? "Your Organization journey"
                : eligible
                  ? "For verified Members"
                  : "Complete Member verification first"}
            </div>
            <h1 className="display-font text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
              Start your own
              <br />
              thrift organization.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mb-8">
              Build a visible business identity with structured records and a
              workspace of your own. One verified Member, one Organization. You
              remain the same TCS Member.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                variant="success"
                disabled={!eligible && !organization}
                onClick={enter}
              >
                {action} &rarr;
              </Button>
              <button
                onClick={() => navigate("dashboard")}
                className="px-6 py-3 text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 lg:px-0 lg:py-12 py-8">
          {/* What is an Organization */}
          <div className="mb-12">
            <h2 className="display-font text-2xl font-bold text-[#0D1117] mb-3">
              What is a TCS Organization?
            </h2>
            <p className="text-[#374151] leading-relaxed mb-4">
              A TCS Organization is your own branded thrift operation — fully
              managed by you, hosted on TCS. You create the groups, set the
              rules, manage the members, and run the cycles. TCS provides the
              digital infrastructure, record-keeping, and coordination tools.
            </p>
            <p className="text-[#374151] leading-relaxed">
              Think of it as taking the thrift savings group you already run —
              or have always wanted to run — and giving it a proper digital
              home.
            </p>
          </div>

          {/* Benefits */}
          <div className="mb-12">
            <h2 className="display-font text-2xl font-bold text-[#0D1117] mb-6">
              Why run your organization on TCS?
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="bg-white rounded-xl border border-[#E2E6F0] p-5"
                >
                  <div className="text-2xl mb-3">{b.icon}</div>
                  <p className="text-sm font-bold text-[#0D1117] mb-1">
                    {b.title}
                  </p>
                  <p className="text-sm text-[#6B7280] leading-relaxed">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="mb-12 bg-[#FFFBEB] rounded-2xl border border-[#FDE68A] px-6 py-6">
            <h2 className="display-font text-xl font-bold text-[#92400E] mb-4">
              Your responsibilities as Organization Owner
            </h2>
            <p className="text-sm text-[#92400E]/80 leading-relaxed mb-4">
              Running a thrift organization on TCS is a position of trust.
              Members rely on you to manage operations fairly and promptly.
            </p>
            <ul className="flex flex-col gap-2.5">
              {responsibilities.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[#92400E]"
                >
                  <svg
                    className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm3.78 5.22a.75.75 0 00-1.06 0L7 9.94 5.28 8.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25a.75.75 0 000-1.06z" />
                  </svg>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* What happens after approval */}
          <div className="mb-12">
            <h2 className="display-font text-2xl font-bold text-[#0D1117] mb-6">
              What happens after you apply?
            </h2>
            <div className="grid sm:grid-cols-4 gap-4">
              {steps.map((s, i) => (
                <div key={s.step} className="flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="display-font text-3xl font-black text-[#E2E6F0]">
                      {s.step}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="hidden sm:block flex-1 h-px bg-[#E2E6F0]" />
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#0D1117] mb-1">
                    {s.title}
                  </p>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="bg-[#1746A2] rounded-2xl px-8 py-8 text-center">
            <h2 className="display-font text-2xl font-bold text-white mb-2">
              Ready to build your organization?
            </h2>
            <p className="text-white/70 text-sm mb-6">
              Your draft stays with your Member during this prototype session.
              Returning here resumes your existing application.
            </p>
            <Button
              size="lg"
              variant="success"
              disabled={!eligible && !organization}
              onClick={enter}
            >
              {action} &rarr;
            </Button>
          </div>
        </div>
      </div>
    </ClientShell>
  )
}
