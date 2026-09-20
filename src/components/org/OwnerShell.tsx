import '../../organizations/owner.css'
import { Dialog } from '../../design/foundation'
import { useState, type ReactNode } from "react"
import { Button } from "../ui"
import { useClient } from "../../clients/ClientContext"
import { fullName } from "../../clients/model"
import { MemberAvatar } from "../../clients/MemberAvatar"
import { useOrganization } from "../../organizations/OrganizationContext"
import { OrganizationBrand } from "../../organizations/OrganizationBrand"
import {
  OrganizationNotice,
  OrganizationScenarios,
  OrganizationStatusChip,
} from "../../organizations/OrganizationUI"
import { hasWorkspace } from "../../organizations/model"
import type { View, NavMeta } from "../../App"

interface Props {
  navigate: (view: View, meta?: NavMeta) => void
  activeView: View
  children: ReactNode
}
export function OwnerShell({ navigate, activeView, children }: Props) {
  const { client } = useClient()
  const { organization } = useOrganization()
  const [mobileOpen, setMobileOpen] = useState(false)
  if (!client || !organization || !hasWorkspace(organization))
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">Your Organization workspace</h1>
        <p className="my-5 text-sm leading-6">
          Complete your Organization application and independent approval before
          entering the Owner workspace.
        </p>
        <Button onClick={() => navigate(client ? "org-opportunity" : "login")}>
          Go to Organization entry
        </Button>
      </div>
    )
  const items = [
    {view:"owner-reports" as View,label:"Reports",glyph:"▤"},
    {view:"owner-reconciliation" as View,label:"Reconciliation",glyph:"≋"},
    {view:"owner-payouts" as View,label:"Payouts",glyph:"↗"},
    { view: "owner-collection" as View, label: "Collections", glyph: "₦" },
    { view: "owner-groups" as View, label: "Groups", glyph: "◫" },
    { label: "Overview", view: "owner-dashboard", glyph: "◫" },
    { label: "Business profile", view: "owner-profile", glyph: "▧" },
    { label: "Settings & lifecycle", view: "owner-settings", glyph: "☷" },
  ] as const
  const navigation = (
    <nav aria-label="Organization navigation" className="space-y-2">
      {items.map((item) => (
        <button
          key={item.view}
          aria-current={activeView === item.view ? "page" : undefined}
          onClick={() => {
            navigate(item.view)
            setMobileOpen(false)
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
            activeView === item.view
              ? "bg-[#1746A2] text-white"
              : "text-[#536174] hover:bg-[#edf3ff]"
          }`}
        >
          <span aria-hidden="true" className="text-lg">
            {item.glyph}
          </span>
          {item.label}
        </button>
      ))}
      <button
        className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-[#536174] hover:bg-[#edf3ff]"
        onClick={() => navigate("org-review")}
      >
        Application record ↗
      </button>
    </nav>
  )
  return (
    <div className="organization-experience min-h-dvh bg-[var(--tcs-bg-cool)] text-[var(--tcs-text)]">
      <a
        href="#organization-main"
        className="sr-only focus:not-sr-only focus:block focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col overflow-y-auto border-r border-[var(--tcs-border)] bg-white px-5 py-7 lg:flex">
        <OrganizationBrand form={organization.form} />
        <div className="mb-8 mt-4">
          <OrganizationStatusChip organization={organization} />
        </div>
        {navigation}
        <div className="mt-7 rounded-2xl bg-[#f0f5fd] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1746A2]">
            A shared foundation
          </p>
          <p className="mt-2 text-sm leading-6 text-[#536174]">
            Your business identity stays consistent wherever Members meet your
            Organization.
          </p>
        </div>
        <div className="mt-auto pt-8">
          <div className="flex items-center gap-3">
            <MemberAvatar client={client} />
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold">
                {fullName(client)}
              </p>
              <p className="mt-1 text-xs text-[#6b7280]">
                Organization Owner · same Member
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => navigate("dashboard")}
          >
            Switch to personal workspace
          </Button>
          <button
            className="mt-4 text-sm text-[#6b7280] hover:underline"
            onClick={() => navigate("login")}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 lg:pl-72">
        <header className="border-b border-[var(--tcs-border)] bg-white px-5 py-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="lg:hidden">
              <OrganizationBrand form={organization.form} />
            </div>
            <p className="hidden text-sm text-[#6b7280] lg:block">
              Organization workspace <span className="mx-2">/</span>{" "}
              {organization.form.name}
            </p>
            <div className="flex items-center gap-3">
              <button
                className="text-sm font-semibold text-[#1746A2] lg:hidden"
                onClick={() => navigate("dashboard")}
              >
                Personal workspace
              </button>
              <button
                aria-expanded={mobileOpen}
                aria-controls="organization-mobile-nav"
                className="rounded-lg bg-[#edf3ff] px-3 py-2 text-sm font-semibold text-[#1746A2] lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                Menu
              </button>
              <OrganizationStatusChip organization={organization} />
            </div>
          </div>
          {mobileOpen && (
            <Dialog label="Organization navigation" drawer onClose={()=>setMobileOpen(false)}><div id="organization-mobile-nav">
              {navigation}
              <button
                className="px-4 py-3 text-sm"
                onClick={() => navigate("login")}
              >
                Sign out
              </button>
            </div></Dialog>
          )}
        </header>
        <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
          <OrganizationScenarios navigate={navigate} />
          <div className="mt-4">
            <OrganizationNotice organization={organization} />
          </div>
        </div>
        <main
          id="organization-main"
          className="tcs-container mx-auto max-w-7xl px-5 py-7 sm:px-8"
        >
          {children}
        </main>
        <footer className="mx-auto max-w-7xl px-5 pb-8 text-xs leading-6 text-[#6b7280] sm:px-8">
          {organization.example ? "Sample Organization · " : ""}Local prototype
          session. Navigation and sign-out retain your changes; page reload
          clears them. No information is sent to TCS.
        </footer>
      </div>
    </div>
  )
}
