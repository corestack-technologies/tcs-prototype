import type {
  CollectionAccount,
  PaymentAttempt,
  ProviderConfirmation,
  DemoOutcome,
} from "./model.ts"
// Local stand-in for Frontend -> TCS Backend -> licensed payment provider.
// No credentials, network requests, bank accounts or real money movement.
export interface CollectionProvider {
  id: string
  collectionAccount: (
    organizationId: string,
    memberId: string,
    organizationName: string,
    memberName: string,
  ) => CollectionAccount
  confirmation: (
    attempt: PaymentAttempt,
    outcome: DemoOutcome,
    confirmedAt: string,
  ) => ProviderConfirmation | null
}
const hash = (value: string) => {
  let h = 2166136261
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0).toString(16).padStart(8, "0").toUpperCase()
}
export const prototypeProvider: CollectionProvider = {
  id: "prototype-provider",
  collectionAccount: (
    organizationId,
    memberId,
    organizationName,
    memberName,
  ) => ({
    id: `collection:${organizationId}:${memberId}`,
    provider: "prototype-provider",
    memberId,
    organizationId,
    scope: "member-organization-demo",
    bankName: "Prototype Provider Bank",
    accountName: `${organizationName} / ${memberName}`,
    accountNumber: "DEMO-" + hash(organizationId + ":" + memberId),
    destination: "organization-provider-arrangement",
    prototype: true,
  }),
  confirmation: (attempt, outcome, confirmedAt) =>
    ["pending", "failed", "expired"].includes(outcome)
      ? null
      : {
          provider: "prototype-provider",
          providerReference: "DEMO-" + attempt.id,
          attemptId: attempt.id,
          organizationId: attempt.organizationId,
          memberId: attempt.memberId,
          currency: "NGN",
          amountMinor:
            outcome === "underpayment"
              ? Math.floor(attempt.expectedMinor * 0.4)
              : outcome === "overpayment"
                ? attempt.expectedMinor + 10000
                : attempt.expectedMinor,
          confirmedAt,
          settlement: "pending",
        },
}
