import { useState } from "react"
import { Alert, Button } from "../ui"
import { OwnerShell } from "./OwnerShell"
import { useClient } from "../../clients/ClientContext"
import { fullName } from "../../clients/model"
import { useOrganization } from "../../organizations/OrganizationContext"
import { OrganizationBrand } from "../../organizations/OrganizationBrand"
import { OrganizationSection } from "../../organizations/OrganizationUI"
import { SettlementAccountEditor } from "../../organizations/SettlementAccountEditor"
import { activateOrganization } from "../../organizations/service"
import type { ClientPageProps } from "../../clients/ClientShell"

export function OrgActivation({ navigate }: ClientPageProps) {
  const { client } = useClient()
  const { organization, updateOrganization } = useOrganization()
  const [acknowledged, setAcknowledged] = useState(false)
  const [error, setError] = useState("")
  if (!client || !organization)
    return (
      <OwnerShell navigate={navigate} activeView="owner-dashboard">
        No Organization selected.
      </OwnerShell>
    )
  if (organization.status !== "approved")
    return (
      <OwnerShell navigate={navigate} activeView="owner-dashboard">
        <h1 className="text-2xl font-semibold">Organization setup</h1>
        <p className="my-5">
          Setup is available only after application approval. Your current
          Organization record remains available.
        </p>
        <Button onClick={() => navigate("org-opportunity")}>
          View Organization status
        </Button>
      </OwnerShell>
    )
  return (
    <OwnerShell navigate={navigate} activeView="owner-dashboard">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl bg-white p-6 sm:p-8">
          <OrganizationBrand form={organization.form} large />
          <h1 className="mt-7 text-3xl font-semibold">
            Make this workspace yours.
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#6b7280]">
            Your Organization application is approved in this scenario. Review
            your business identity and confirm its settlement account to
            complete setup. You continue as {fullName(client)}, the same TCS
            Member.
          </p>
          <Button
            className="mt-5"
            variant="secondary"
            onClick={() => navigate("owner-profile")}
          >
            Review branding & business profile
          </Button>
        </div>
        <OrganizationSection title="Set up your settlement account">
          <SettlementAccountEditor />
        </OrganizationSection>
        <OrganizationSection title="Owner responsibilities">
          <p className="text-sm leading-7 text-[#6b7280]">
            Your Organization remains responsible for its Groups and funds
            settled to it. TCS coordinates the records without taking custody of
            thrift funds. Participation as a Member remains separate from your
            Owner responsibilities.
          </p>
          <label className="mt-5 flex items-start gap-3 text-sm leading-6">
            <input
              type="checkbox"
              checked={acknowledged}
              className="mt-1 h-4 w-4 accent-[#1746A2]"
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            I have reviewed the business profile and settlement account, and
            understand my responsibilities as Organization Owner.
          </label>
          {error && (
            <Alert type="error" className="mt-5">
              {error}
            </Alert>
          )}
          <Button
            className="mt-6"
            disabled={!organization.settlement || !acknowledged}
            onClick={() => {
              try {
                updateOrganization((org) =>
                  activateOrganization(org, client, acknowledged),
                )
                navigate("owner-dashboard")
              } catch (err) {
                setError((err as Error).message)
              }
            }}
          >
            Activate Organization workspace
          </Button>
        </OrganizationSection>
      </div>
    </OwnerShell>
  )
}
