import type { Client } from "../clients/model.ts"
import { canApply, type Organization } from "./model.ts"
import { createOrganization } from "./service.ts"
import {
  organizationScenarios,
  seedOrganization,
  type OrganizationScenario,
} from "./seeds.ts"

// Memory-only prototype state. Scenario selection never changes Member identity.
export class OrganizationSession {
  replaceOperations(expected:Organization[],next:Organization[]) {
    for(const org of next){const previous=this.all().find(o=>o.id===org.id),before=expected.find(o=>o.id===org.id);if(!previous||!before||JSON.stringify(previous)!==JSON.stringify(before)||previous.ownerMemberId!==org.ownerMemberId)throw Error('Organization changed; preview again.')}
    for(const org of next){const entry=[...this.records].find(([,o])=>o.id===org.id)!;this.records.set(entry[0],org)}
  }
  all() { return [...this.records.values()] }
  ensureDecisionDemo(member:Client){for(const scenario of ['settlement-pending','submitted'] as const){const key=member.id+':'+scenario;if(!this.records.has(key))this.records.set(key,seedOrganization(member,scenario))}}
  ensureOperationsDemo(member: Client) {
    for (const scenario of ['active', 'pending'] as const) {
      const key = member.id + ':' + scenario
      if (!this.records.has(key)) this.records.set(key, seedOrganization(member, scenario))
    }
    return this.records.get(member.id + ':active')!
  }
  private records = new Map<string, Organization>()
  private selections = new Map<string, OrganizationScenario>()
  scenario(member: Client | null): OrganizationScenario {
    return member ? (this.selections.get(member.id) ?? "personal") : "personal"
  }
  private key(member: Client) {
    return `${member.id}:${this.scenario(member)}`
  }
  current(member: Client | null) {
    return member ? (this.records.get(this.key(member)) ?? null) : null
  }
  start(member: Client) {
    this.records.set(
      this.key(member),
      createOrganization(member, this.current(member)),
    )
  }
  select(member: Client, next: OrganizationScenario) {
    if (!canApply(member))
      throw new Error(
        "Use an active, verified Member to inspect Organization scenarios.",
      )
    if (!organizationScenarios.some((scenario) => scenario.id === next))
      throw new Error("Unknown Organization scenario.")
    const key = `${member.id}:${next}`
    if (next !== "personal" && !this.records.has(key))
      this.records.set(key, seedOrganization(member, next))
    this.selections.set(member.id, next)
  }
  update(
    member: Client,
    expectedId: string,
    transform: (org: Organization) => Organization,
  ) {
    const previous = this.current(member)
    if (
      !previous ||
      previous.id !== expectedId ||
      previous.ownerMemberId !== member.id
    )
      throw new Error(
        "This Organization context has changed. Reopen the current record.",
      )
    const next = transform(previous)
    if (next.id !== previous.id || next.ownerMemberId !== member.id)
      throw new Error(
        "Organization ownership and tenant identity cannot be changed.",
      )
    this.records.set(this.key(member), next)
  }
}
