import '../../organizations/owner.css'
﻿import { useState } from "react"
import { Alert, Button, Field, Textarea } from "../ui"
import { ClientShell, type ClientPageProps } from "../../clients/ClientShell"
import { useClient } from "../../clients/ClientContext"
import { fullName } from "../../clients/model"
import { useOrganization } from "../../organizations/OrganizationContext"
import { OrganizationBrand } from "../../organizations/OrganizationBrand"
import {
  OrganizationSection,
  OrganizationStatusChip,
} from "../../organizations/OrganizationUI"
import { hasWorkspace } from "../../organizations/model"
import {
  respondToInformation,
  validateOrganizationFile,
} from "../../organizations/service"

export function OrgReviewStatus({ navigate }: ClientPageProps) {
  const { client } = useClient()
  const { organization, updateOrganization } = useOrganization()
  const [response, setResponse] = useState("")
  const [document, setDocument] = useState<File | null>(null)
  const [error, setError] = useState("")
  if (!client || !organization)
    return (
      <ClientShell navigate={navigate} active="organization"><div className="organization-experience">
        <Button onClick={() => navigate("org-opportunity")}>
          Organization entry
        </Button>
      </div></ClientShell>
    )
  const titles = {
    draft: "Your saved application",
    submitted: "Application submitted",
    pending: "Your application is under review",
    "information-required": "A little more information is needed",
    approved: "Your Organization is approved",
    declined: "Your application was declined",
    active: "Your Organization application record",
    restricted: "Your Organization application record",
    suspended: "Your Organization application record",
    "closure-pending": "Your Organization application record",
    closed: "Your retained application record",
  }
  const snapshot = organization.application.snapshot
  return (
    <ClientShell navigate={navigate} active="organization"><div className="organization-experience">
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          className="tcs-link text-sm"
          onClick={() => navigate("org-opportunity")}
        >
          ← Organization entry & demo scenarios
        </button>
        <div className="rounded-3xl bg-white p-6 sm:p-8">
          <OrganizationBrand form={organization.form} />
          <div className="mt-6">
            <OrganizationStatusChip organization={organization} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight">
            {titles[organization.status]}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#6b7280]">
            {organization.status === "submitted" ||
            organization.status === "pending"
              ? "Your submitted information is retained for independent TCS review. No approval is automatic. A decision or request for information will be provided through Operations when connected."
              : organization.status === "approved"
                ? "Your application has an approved outcome in this scenario. Complete business profile and settlement setup to enter your Organization workspace."
                : "Your Organization and underlying Member identity remain linked throughout the lifecycle."}
          </p>
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[#6b7280]">Application reference</dt>
              <dd className="mt-1 break-all font-mono">{organization.id}</dd>
            </div>
            <div>
              <dt className="text-[#6b7280]">Owner / applicant</dt>
              <dd className="mt-1 font-semibold">{fullName(client)}</dd>
            </div>
            {organization.application.submittedAt && (
              <div>
                <dt className="text-[#6b7280]">Submitted</dt>
                <dd className="mt-1">
                  {new Date(
                    organization.application.submittedAt,
                  ).toLocaleString("en-NG")}
                </dd>
              </div>
            )}
          </dl>
          {organization.application.note && (
            <Alert
              className="mt-6"
              type={organization.status === "declined" ? "error" : "warning"}
              title={
                organization.status === "declined"
                  ? "Decision note"
                  : "Requested information"
              }
            >
              {organization.application.note}
            </Alert>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {organization.status === "draft" && (
              <Button onClick={() => navigate("org-application")}>
                Continue application
              </Button>
            )}
            {organization.status === "approved" && (
              <Button onClick={() => navigate("org-activation")}>
                Complete Organization setup
              </Button>
            )}
            {hasWorkspace(organization) &&
              organization.status !== "approved" && (
                <Button onClick={() => navigate("owner-dashboard")}>
                  Enter Organization workspace
                </Button>
              )}
            <Button variant="secondary" onClick={() => navigate("dashboard")}>
              Personal workspace
            </Button>
          </div>
        </div>
        {organization.status === "information-required" && (
          <OrganizationSection
            title="Respond to TCS"
            description="Your response is appended to the application; the original submission stays intact."
          >
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
                try {
                  updateOrganization((org) =>
                    respondToInformation(org, client, response, document),
                  )
                  setResponse("")
                  setDocument(null)
                  setError("")
                } catch (err) {
                  setError((err as Error).message)
                }
              }}
            >
              <Field label="Additional information" required>
                <Textarea
                  rows={5}
                  value={response}
                  onChange={(event) => setResponse(event.target.value)}
                />
              </Field>
              <label className="block text-sm font-semibold">
                Supporting record (optional)
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.xls,.xlsx"
                  className="mt-3 block w-full text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ""
                    if (!file) return
                    try {
                      validateOrganizationFile(file)
                      setDocument(file)
                      setError("")
                    } catch (err) {
                      setError((err as Error).message)
                    }
                  }}
                />
              </label>
              {document && (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>{document.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDocument(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {error && <Alert type="error">{error}</Alert>}
              <Button type="submit" disabled={!response.trim()}>
                Submit information for review
              </Button>
            </form>
          </OrganizationSection>
        )}
        {organization.application.responses.length > 0 && (
          <OrganizationSection title="Additional information submitted">
            <ol className="space-y-4">
              {organization.application.responses.map((item) => (
                <li key={item.at}>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {item.text}
                  </p>
                  {item.document && (
                    <p className="mt-2 text-sm">
                      Attached: {item.document.name}
                    </p>
                  )}
                  <time
                    className="mt-2 block text-xs text-[#6b7280]"
                    dateTime={item.at}
                  >
                    {new Date(item.at).toLocaleString("en-NG")}
                  </time>
                </li>
              ))}
            </ol>
          </OrganizationSection>
        )}
        {snapshot && (
          <OrganizationSection
            title="Submitted application"
            description="The original business information remains intact when your live profile changes."
          >
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              {Object.entries(snapshot)
                .filter(
                  ([key]) =>
                    !["accent", "logoStyle", "declarationAccepted"].includes(
                      key,
                    ),
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <dt className="capitalize text-[#6b7280]">
                      {key.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="mt-1 break-words leading-6">
                      {value instanceof File
                        ? value.name
                        : String(value || "Not provided")}
                    </dd>
                  </div>
                ))}
            </dl>
          </OrganizationSection>
        )}
        <p className="text-sm leading-6 text-[#6b7280]">
          Review decisions are represented by independent demo scenarios.
          Selecting an example does not approve or replace your own application.
        </p>
      </div>
    </div></ClientShell>
  )
}
