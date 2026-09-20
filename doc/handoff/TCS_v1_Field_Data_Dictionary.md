# TCS v1 Field & Data Dictionary

Frozen product extraction for TCS Prototype v1. Production requirements below are not implemented infrastructure.

This is an extracted field inventory, not SQL design. Required in a TypeScript shape does not imply a nonempty value or a mandatory UI field. Drafts deliberately contain empty strings. The lifecycle/source rules below govern editability and validation; production must validate on the server. Nested value shapes are retained so no field is silently omitted. File objects become protected storage references, not serialized browser File objects.

## Field rules and lifecycle ownership

| Field family | Required / validation | Editable / lock / source |
| --- | --- | --- |
| Profile identity/contact | Required submission fields follow clients/model.ts profile validation; normalized contact values; contact verification follows configured channels | Member edits own draft; submitted KYC snapshot remains immutable; changed evidence uses response/resubmission |
| NIN and identity/address documents | Valid identity input and required evidence on submission; no production provider chosen | Member draft then protected KYC submission; reviewer sees permitted evidence; production encrypted/object-storage references |
| Organization form / declaration | Organization model/application validators; declaration required to submit | Owner draft; submission snapshot retained; review changes recorded separately |
| Settlement bank/account | Validated bank and 10-digit account, resolved name, Owner confirmation | Initial setup or reviewed settlement change; prior snapshot preserved |
| Group amount / fee | Positive allowed amount and mandatory positive fee within boundary; prototype amount is naira while financial amounts use integer kobo | Owner draft; accepted terms revision; activation snapshot lock; controlled amendment only |
| Frequency / schedule / timezone | Daily, Weekly, Biweekly, Monthly; valid schedule; Africa/Lagos business calendar | Draft schedule, then retained Round dates and snapshot |
| Positions / fractions | Full or half only; capacity, maximum holdings, complete payout order | Draft allocation; acceptance tied to revision; active departure via lifecycle |
| dailyPenaltyRateBps | Integer 0–10, zero disables; blank drafts zero; suitable seed default five | Material accepted term; activation locks rate and ceiling; legacy defaultCharge fields are not daily rates |
| Payment amount / reference | Safe nonnegative integer kobo; positive for receipts; provider identity, currency, tenant and target match | Trusted provider fact immutable; append allocation/exception separately |
| Payout installment / evidence | Positive amount, current instruction/bank, reference and required partial reason/completion plan | Owner records external transfer; beneficiary response separate; facts preserved after decision |
| Recovery / penalty event | Explicit debt and component/day links; principal-first allocation; waivers cannot exceed unpaid penalty | Append-only receipts/accrual/waivers; no principal waiver disguised as penalty reduction |
| Internal authority / audit | Exact catalogue permission; active unlocked user and active roles; reason/current preview for privileged changes | Authorized independent administrator; immutable authority and before/after snapshots |
| Business Date / process | Valid local date; source-history protection; production controlled mode denied | Authorized preview/apply; run facts immutable; retries new linked runs |

## Complete declared field shapes

### Profile — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| firstName | string | Required in prototype type |
| middleName | string | Required in prototype type |
| lastName | string | Required in prototype type |
| email | string | Required in prototype type |
| phone | string | Required in prototype type |
| dob | string | Required in prototype type |
| gender | string | Required in prototype type |
| language | string | Required in prototype type |
| address | string | Required in prototype type |
| city | string | Required in prototype type |
| state | string | Required in prototype type |
| bankName | string | Required in prototype type |
| accountNumber | string | Required in prototype type |
| accountName | string | Required in prototype type |

### IdentityDraft — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| nin | string | Required in prototype type |
| ninDocument | File / null | Required in prototype type |
| addressDocument | File / null | Required in prototype type |

### Clearance — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| activeCycles | number | Required in prototype type |
| obligations | number | Required in prototype type |
| awaitingPayouts | number | Required in prototype type |
| recoveryCases | number | Required in prototype type |
| disputes | number | Required in prototype type |

### Client — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| restrictions | import('../operations/interventionModel.ts').RestrictionRecord[] | Optional in prototype type |
| interventionReview | import('../operations/review.ts').SourceReview | Optional in prototype type |
| profileImage | File | Optional in prototype type |
| bankDetails | MemberBankDetails | Optional in prototype type |
| restrictionReason | string | Optional in prototype type |
| restrictionNextAction | string | Optional in prototype type |
| id | string | Required in prototype type |
| profile | Profile | Required in prototype type |
| contacts | { email: boolean; phone: boolean } | Required in prototype type |
| onboardingComplete | boolean | Required in prototype type |
| verification | { review?: SourceReview status: VerificationStatus responses?: { at: string; text: string; document: File / null }[] submittedAt?: string note?: string submission?: { profile: Profile; nin: string; documents: string[] } } | Required in prototype type |
| identity | IdentityDraft | Required in prototype type |
| accountStatus | AccountStatus | Required in prototype type |
| closureRequestedAt | string | Optional in prototype type |
| clearance | Clearance / null | Required in prototype type |
| example | boolean | Required in prototype type |
| personaId | string | Optional in prototype type |
| activity | MemberActivity | Optional in prototype type |
| history | { at: string; action: string }[] | Required in prototype type |

### MemberBankDetails — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| bankCode | string | Required in prototype type |
| bankName | string | Required in prototype type |
| accountNumber | string | Required in prototype type |
| resolvedName | string | Required in prototype type |
| status | 'demo-confirmed' | Required in prototype type |
| confirmedAt | string | Required in prototype type |

### GroupPreview — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| name | string | Required in prototype type |
| organization | string | Required in prototype type |
| monthlyContribution | number | Required in prototype type |
| position | number | Required in prototype type |
| positions | number | Required in prototype type |
| round | number | Required in prototype type |
| cycleNumber | number | Required in prototype type |
| contributionDueDate | string | Required in prototype type |
| paidRounds | number | Required in prototype type |
| payoutDate | string | Required in prototype type |
| scheduledValue | number | Required in prototype type |
| organizationFee | number | Required in prototype type |

### MemberActivity — src/clients/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| asOf | string | Required in prototype type |
| groups | GroupPreview[] | Required in prototype type |
| contributions | { id: string; groupId: string; amount: number; paidAt: string; reference: string }[] | Required in prototype type |
| payouts | { id: string; groupId: string; amount: number; receivedAt: string; reference: string }[] | Required in prototype type |

### OrganizationForm — src/organizations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| name | string | Required in prototype type |
| legalName | string | Required in prototype type |
| tagline | string | Required in prototype type |
| description | string | Required in prototype type |
| orgType | string | Required in prototype type |
| location | string | Required in prototype type |
| email | string | Required in prototype type |
| phone | string | Required in prototype type |
| address | string | Required in prototype type |
| registration | string | Required in prototype type |
| logo | File / null | Required in prototype type |
| accent | "blue" / "navy" | Required in prototype type |
| logoStyle | "arch" / "circle" / "initials" | Required in prototype type |
| estimatedMembers | string | Required in prototype type |
| frequency | string | Required in prototype type |
| avgAmount | string | Required in prototype type |
| existingProcess | string | Required in prototype type |
| communitiesServed | string | Required in prototype type |
| meetingSchedule | string | Required in prototype type |
| whyDigitize | string | Required in prototype type |
| challenges | string | Required in prototype type |
| expectedBenefits | string | Required in prototype type |
| existingRecords | File / null | Required in prototype type |
| communityRefs | string | Required in prototype type |
| supportingDocs | File / null | Required in prototype type |
| declarationAccepted | boolean | Required in prototype type |

### SettlementAccount — src/organizations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| bankCode | string | Required in prototype type |
| bankName | string | Required in prototype type |
| accountNumber | string | Required in prototype type |
| resolvedName | string | Required in prototype type |
| validation | "demo-resolved" | Required in prototype type |
| confirmation | "owner-confirmed" | Required in prototype type |
| confirmedAt | string | Required in prototype type |

### SettlementChange — src/organizations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| proposed | SettlementAccount | Required in prototype type |
| previous | SettlementAccount | Required in prototype type |
| reason | string | Required in prototype type |
| status | "pending" / "approved" / "information-required" / "rejected" | Required in prototype type |
| requestedAt | string | Required in prototype type |
| approvedAt | string | Optional in prototype type |
| effectiveAt | string | Optional in prototype type |

### Organization — src/organizations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| restrictions | import('../operations/interventionModel.ts').RestrictionRecord[] | Optional in prototype type |
| interventionReview | import('../operations/review.ts').SourceReview | Optional in prototype type |
| commercialRestricted | boolean | Optional in prototype type |
| id | string | Required in prototype type |
| ownerMemberId | string | Required in prototype type |
| status | OrganizationStatus | Required in prototype type |
| form | OrganizationForm | Required in prototype type |
| application | { review?: SourceReview submittedAt?: string snapshot?: OrganizationForm ownerSnapshot?: { name: string email: string } note?: string responses: { at: string text: string document: File / null }[] } | Required in prototype type |
| settlement | SettlementAccount | Optional in prototype type |
| settlementChanges | SettlementChange[] | Required in prototype type |
| activatedAt | string | Optional in prototype type |
| closureRequestedAt | string | Optional in prototype type |
| clearance | { activeCycles: number outstandingPayouts: number exitSettlements: number recoveryCases: number disputes: number unpaidTcsObligations: number paymentCases?: number payoutCases?: number reconciliationCases?: number tcsReceivableCases?: number } / null | Required in prototype type |
| notifications | { applications: boolean contributions: boolean payouts: boolean announcements: boolean } | Required in prototype type |
| activity | { asOf: string groups: { id: string name: string members: number amount: number frequency: string round: number rounds: number paid: number status: "active" / "completed" }[] contributed: number paidOut: number completedCycles: number payouts: { id: string groupId: string groupName: string recipient: string amount: number dueDate: string status: "in-progress" / "upcoming" / "ready" / "dispatched" }[] recent: { id: string message: string time: string }[] pendingJoinRequests: number } | Required in prototype type |
| history | { at: string actor: string action: string before?: unknown after?: unknown reason?: string }[] | Required in prototype type |
| example | boolean | Required in prototype type |

### Draft — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| name | string | Required in prototype type |
| description | string | Required in prototype type |
| currency | "NGN" | Required in prototype type |
| visibility | Visibility | Required in prototype type |
| amount | number | Required in prototype type |
| frequency | Frequency | Required in prototype type |
| positions | number | Required in prototype type |
| startDate | string | Required in prototype type |
| contributionOpenDay | number | Required in prototype type |
| gracePeriodDays | number | Required in prototype type |
| timezone | string | Required in prototype type |
| contributionWindowDays | number | Required in prototype type |
| allowSplit | boolean | Required in prototype type |
| splitParts | number | Required in prototype type |
| multiplePositions | "none" / "max" / "unlimited" | Required in prototype type |
| maxPerMember | number | Required in prototype type |
| feeEnabled | boolean | Required in prototype type |
| feeType | FeeType | Required in prototype type |
| feeValue | number | Required in prototype type |
| dailyPenaltyRateBps | number | Optional in prototype type |
| defaultChargeEnabled | boolean | Required in prototype type |
| defaultChargeType | FeeType | Required in prototype type |
| defaultChargeValue | number | Required in prototype type |
| defaultChargeCapEnabled | boolean | Required in prototype type |
| defaultChargeCap | number | Required in prototype type |
| defaultChargeWaivable | boolean | Required in prototype type |
| recipientPolicy | "optional" | Required in prototype type |
| rules | string | Required in prototype type |
| notesToMembers | string | Required in prototype type |

### FeeBoundary — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| maxPercentage | number | Required in prototype type |
| maxFlat | number | Required in prototype type |

### Position — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| n | number | Required in prototype type |
| holders | { memberId: string ; fraction: Fraction }[] | Required in prototype type |

### Acceptance — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| at | string | Required in prototype type |
| actorId | string | Required in prototype type |
| terms | string | Required in prototype type |
| revision | number | Required in prototype type |

### Participant — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| name | string | Required in prototype type |
| initials | string | Required in prototype type |
| email | string | Required in prototype type |
| verified | boolean | Required in prototype type |
| groupsCompleted | number | Required in prototype type |
| onTimeRate | number | Required in prototype type |
| source | "invitation" / "public-request" | Required in prototype type |
| status | "pending" / "approved" / "rejected" | Required in prototype type |
| equivalent | number | Required in prototype type |
| revision | number | Required in prototype type |
| acceptances | Acceptance[] | Required in prototype type |
| reminderSent | boolean | Required in prototype type |

### Cycle — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| active | ActiveCycle | Optional in prototype type |
| completedAt | string | Optional in prototype type |
| continuation | {mode:"rollover" / "fresh";fromCycleId:string;reconfirmationDeadline:string;referenceAt?:string} | Optional in prototype type |
| activationHistory | {at:string;snapshot:NonNullable<Cycle["snapshot"]>}[] | Optional in prototype type |
| id | string | Required in prototype type |
| number | number | Required in prototype type |
| status | "draft" / "activated" / "cancelled" / "completed" / "completed-with-recovery" / "force-closed" | Required in prototype type |
| terms | Draft | Required in prototype type |
| participants | Participant[] | Required in prototype type |
| positions | Position[] | Required in prototype type |
| orderFinalized | boolean | Required in prototype type |
| financial | { obligations: number payments: number allocations: number payouts: number postings: number } | Required in prototype type |
| activatedAt | string | Optional in prototype type |
| cancelledAt | string | Optional in prototype type |
| cancellationReason | string | Optional in prototype type |
| snapshot | { penaltyCeilingBps?: number; terms: Draft ; participants: Participant[] ; positions: Position[] } | Optional in prototype type |

### ThriftGroup — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| penalties | PenaltyLedger | Optional in prototype type |
| manualContributions | ManualContribution[] | Optional in prototype type |
| manualPolicy | FinancePolicy | Optional in prototype type |
| reconciliationBlockers | number | Optional in prototype type |
| commercialCommencementRestricted | boolean | Optional in prototype type |
| payouts | PayoutState | Optional in prototype type |
| payments | PaymentRecords | Optional in prototype type |
| lifecycle | GroupLifecycle | Optional in prototype type |
| id | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| name | string | Required in prototype type |
| description | string | Required in prototype type |
| visibility | Visibility | Required in prototype type |
| currentCycleId | string / null | Required in prototype type |
| cycles | Cycle[] | Required in prototype type |
| history | { at: string ; action: string ; actor: string }[] | Required in prototype type |

### ReadinessCheck — src/groups/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| label | string | Required in prototype type |
| description | string | Required in prototype type |
| status | "pass" / "fail" | Required in prototype type |
| required | boolean | Required in prototype type |
| detail | string | Required in prototype type |
| action | string | Required in prototype type |
| actionView | "owner-group-setup" / "owner-group-recruit" / "owner-group-positions" / "owner-group-rules" / "owner-settings" / "org-activation" | Required in prototype type |

### RoundSchedule — src/rounds/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| periodStart | string | Required in prototype type |
| periodEnd | string | Required in prototype type |
| opensAt | string | Required in prototype type |
| dueAt | string | Required in prototype type |
| dueDayStartsAt | string | Required in prototype type |
| lateAt | string | Required in prototype type |
| payoutTargetAt | string | Required in prototype type |
| timezone | string | Required in prototype type |

### Round — src/rounds/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| number | number | Required in prototype type |
| position | number | Required in prototype type |
| beneficiaries | { memberId: string fraction: Fraction entitlementMinor: number }[] | Required in prototype type |
| scheduledPayoutValueMinor | number | Required in prototype type |
| schedule | RoundSchedule | Required in prototype type |

### ObligationComponent — src/rounds/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| position | number | Required in prototype type |
| fraction | Fraction | Required in prototype type |
| requiredMinor | number | Required in prototype type |
| optionalMinor | number | Required in prototype type |
| requiredSatisfiedMinor | number | Required in prototype type |
| optionalSatisfiedMinor | number | Required in prototype type |

### Obligation — src/rounds/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| memberId | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| components | ObligationComponent[] | Required in prototype type |

### ActiveCycle — src/rounds/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| timeSource | 'ENVIRONMENT' / 'SCENARIO' | Optional in prototype type |
| generatedAt | string | Required in prototype type |
| referenceAt | string | Required in prototype type |
| rounds | Round[] | Required in prototype type |
| obligations | Obligation[] | Required in prototype type |
| demo | string | Optional in prototype type |
| contributionPolicy | { partial: "unconfigured" / "allowed" / "prohibited" / "demo-only" advance: "unconfigured" / "allowed" / "prohibited" / "demo-only" } | Optional in prototype type |
| generatedRoundIds | string[] | Optional in prototype type |
| resolvedRoundIds | string[] | Required in prototype type |
| endedAt | string | Optional in prototype type |
| penaltyEnabled | boolean | Optional in prototype type |

### CollectionAccount — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| provider | string | Required in prototype type |
| memberId | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| scope | "member-organization-demo" | Required in prototype type |
| bankName | string | Required in prototype type |
| accountName | string | Required in prototype type |
| accountNumber | string | Required in prototype type |
| destination | "organization-provider-arrangement" | Required in prototype type |
| prototype | true | Required in prototype type |

### AllocationTarget — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| obligationId | string | Required in prototype type |
| componentId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| kind | "required" / "optional" | Required in prototype type |
| amountMinor | number | Required in prototype type |

### PaymentAttempt — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| provider | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| accountId | string | Required in prototype type |
| createdAt | string | Required in prototype type |
| updatedAt | string | Required in prototype type |
| status | AttemptStatus | Required in prototype type |
| expectedMinor | number | Required in prototype type |
| intent | "contribution" / "advance" | Optional in prototype type |
| includeOptional | boolean | Required in prototype type |
| targets | AllocationTarget[] | Required in prototype type |
| demoOutcome | DemoOutcome | Required in prototype type |
| transactionId | string | Optional in prototype type |

### ProviderConfirmation — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| provider | string | Required in prototype type |
| providerReference | string | Required in prototype type |
| attemptId | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| currency | "NGN" | Required in prototype type |
| amountMinor | number | Required in prototype type |
| confirmedAt | string | Required in prototype type |
| settlement | "pending" / "settled" / "exception" | Required in prototype type |

### PaymentTransaction — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| businessAt | string | Optional in prototype type |
| id | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| receivedAt | string | Required in prototype type |
| status | "confirmed" | Required in prototype type |
| allocationStatus | "unallocated" / "allocated" / "partially-allocated" / "exception" | Required in prototype type |
| holdReason | "awaiting-round-opening" | Optional in prototype type |
| allocatedMinor | number | Required in prototype type |
| unallocatedMinor | number | Required in prototype type |

### PaymentAllocation — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| businessAt | string | Optional in prototype type |
| source | "organization-confirmed-manual" | Optional in prototype type |
| id | string | Required in prototype type |
| transactionId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| confirmedAt | string | Required in prototype type |
| timeliness | "on-time" / "grace" / "late" / "optional" | Required in prototype type |

### PaymentException — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| transactionId | string | Required in prototype type |
| kind | "amount-mismatch" / "ineligible-obligation" / "duplicate-conflict" | Required in prototype type |
| amountMinor | number | Required in prototype type |
| reason | string | Required in prototype type |
| at | string | Required in prototype type |
| status | "open" | Required in prototype type |

### OptionalDecision — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| choice | "contribute" / "skip" | Required in prototype type |
| at | string | Required in prototype type |
| lockedAt | string | Optional in prototype type |
| confirmedMinorAtCutoff | number | Optional in prototype type |

### PaymentRecords — src/payments/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| optionalDecisions | OptionalDecision[] | Optional in prototype type |
| accounts | CollectionAccount[] | Required in prototype type |
| attempts | PaymentAttempt[] | Required in prototype type |
| transactions | PaymentTransaction[] | Required in prototype type |
| allocations | PaymentAllocation[] | Required in prototype type |
| exceptions | PaymentException[] | Required in prototype type |

### PayoutPolicy — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| source | "prototype-policy" | Required in prototype type |
| confirmationHours | number | Required in prototype type |
| disputeHours | number | Required in prototype type |
| breachHours | number | Required in prototype type |
| tcsSharePercent | number | Required in prototype type |
| flatFeeSplit | "position-share" | Optional in prototype type |
| collectionSplit | "own-optional" | Optional in prototype type |
| lateOptional | "exception" | Optional in prototype type |

### BankSnapshot — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| memberId | string | Required in prototype type |
| capturedAt | string | Required in prototype type |

### PayoutInstruction — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| at | string | Required in prototype type |
| bank | BankSnapshot | Required in prototype type |
| scheduledValueMinor | number | Required in prototype type |
| entitlementMinor | number | Required in prototype type |
| actualRoundCollectionMinor | number | Required in prototype type |
| attributableCollectionMinor | number | Required in prototype type |
| feeMinor | number | Required in prototype type |
| netMinor | number | Required in prototype type |
| status | "current" / "stale" | Required in prototype type |
| staleReason | string | Optional in prototype type |

### PayoutInstallment — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| instructionId | string | Required in prototype type |
| bank | BankSnapshot | Required in prototype type |
| amountMinor | number | Required in prototype type |
| at | string | Required in prototype type |
| recordedAt | string | Required in prototype type |
| actorId | string | Required in prototype type |
| reference | string | Required in prototype type |
| evidence | { name: string ; type: string ; size: number ; file?: File } | Optional in prototype type |
| notes | string | Required in prototype type |
| partial | boolean | Required in prototype type |
| partialReason | string | Optional in prototype type |
| completionPlan | string | Optional in prototype type |
| expectedCompletionAt | string | Optional in prototype type |
| feeRecognizedMinor | number | Required in prototype type |
| tcsShareMinor | number | Required in prototype type |
| confirmationDueAt | string | Required in prototype type |
| disputeClosesAt | string | Optional in prototype type |
| status | "awaiting-confirmation" / "member-confirmed" / "window-elapsed" / "disputed" | Required in prototype type |
| confirmedAt | string | Optional in prototype type |
| confirmedBy | string | Optional in prototype type |
| autoCompletedAt | string | Optional in prototype type |
| finalizedAt | string | Optional in prototype type |
| amountException | string | Optional in prototype type |

### PayoutDispute — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| installmentId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| reason | string | Required in prototype type |
| at | string | Required in prototype type |
| status | "open" / "resolved" | Required in prototype type |
| process | import("../operations/interventionModel.ts").DisputeProcess | Optional in prototype type |

### PayoutRecord — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | import("../operations/review.ts").SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| position | number | Required in prototype type |
| memberId | string | Required in prototype type |
| fraction | 1 / 0.5 | Required in prototype type |
| beneficiaryName | string | Required in prototype type |
| calculation | { scheduledValueMinor: number entitlementMinor: number actualRoundCollectionMinor: number attributableCollectionMinor: number feeMinor: number netMinor: number } | Optional in prototype type |
| calculationChanged | string | Optional in prototype type |
| readyAt | string | Required in prototype type |
| targetAt | string | Required in prototype type |
| instructions | PayoutInstruction[] | Required in prototype type |
| installments | PayoutInstallment[] | Required in prototype type |
| disputes | PayoutDispute[] | Required in prototype type |
| policy | PayoutPolicy | Optional in prototype type |
| breach | { at: string dueAt: string amountMinor: number status: "open" / "resolved" resolvedAt?: string caseId: string } | Optional in prototype type |
| status | "ready" / "instruction-prepared" / "partially-paid" / "awaiting-confirmation" / "disputed" / "completed-member-confirmed" / "completed-window-elapsed" / "completed-operations-evidence" / "exception" | Required in prototype type |
| completedAt | string | Optional in prototype type |
| finalizedAt | string | Optional in prototype type |

### PayoutState — src/payouts/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| policy | PayoutPolicy | Optional in prototype type |
| records | PayoutRecord[] | Required in prototype type |
| demoBanks | Record<string, MemberBankDetails> | Optional in prototype type |
| demo | string | Optional in prototype type |
| referenceAt | string | Optional in prototype type |

### ExitCase — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | import("../operations/review.ts").SourceReview | Optional in prototype type |
| settlementConfirmations | {id:string;at:string;actor:string;amountMinor:number;reason:string;evidence:string[]}[] | Optional in prototype type |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| kind | "withdrawal" / "early-exit" | Required in prototype type |
| status | "requested" / "approved" / "declined" | Required in prototype type |
| requestedAt | string | Required in prototype type |
| reason | string | Required in prototype type |
| approvedAt | string | Optional in prototype type |
| positions | Position[] | Required in prototype type |
| recognizedContributionsMinor | number | Required in prototype type |
| settlement | { dueMinor: number status: "due" / "resolved" timing: "cycle-end" / "after-regularization" / "immediate" / "agreed-date" dueAt?: string responsibility: "organization" escalatedAt?: string } | Required in prototype type |

### Replacement — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| exitId | string | Required in prototype type |
| outgoingMemberId | string | Required in prototype type |
| incomingMemberId | string | Required in prototype type |
| incomingName | string | Required in prototype type |
| proposedAt | string | Required in prototype type |
| positions | Position[] | Required in prototype type |
| terms | Draft | Required in prototype type |
| acceptance | { at: string ; actorId: string ; terms: string } | Optional in prototype type |
| regularizationRequiredMinor | number | Required in prototype type |
| regularizationSatisfiedMinor | number | Required in prototype type |
| status | "proposed" / "awaiting-regularization" / "effective" | Required in prototype type |
| effectiveAt | string | Optional in prototype type |
| demoFinancialState | boolean | Optional in prototype type |

### RecoveryCase — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| regularizedDefault | boolean | Optional in prototype type |
| recordedAt | string | Optional in prototype type |
| recoveryPayments | {id:string;amountMinor:number;businessAt:string;recordedAt:string}[] | Optional in prototype type |
| obligationIds | string[] | Optional in prototype type |
| penaltyObligations | {id:string;dueAt:string;amountMinor:number;obligationId?:string}[] | Optional in prototype type |
| penaltyWaivers | {id:string;penaltyId?:string;amountMinor:number;at:string;authority:string;reason:string;evidence:string[]}[] | Optional in prototype type |
| review | import("../operations/review.ts").SourceReview | Optional in prototype type |
| restrictions | import("../operations/interventionModel.ts").RestrictionRecord[] | Optional in prototype type |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| principalMinor | number | Required in prototype type |
| penaltyMinor | number | Required in prototype type |
| recoveredMinor | number | Required in prototype type |
| status | "open" / "awaiting-review" / "resolved" | Required in prototype type |
| restricted | boolean | Required in prototype type |
| openedAt | string | Required in prototype type |
| resolvedAt | string | Optional in prototype type |
| resolvedBy | string | Optional in prototype type |
| reviewStatus | "pending" / "reviewed" | Required in prototype type |
| reason | string | Required in prototype type |
| demoFinancialState | boolean | Optional in prototype type |

### AmendmentRequest — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| effectiveAt | string | Optional in prototype type |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| reason | string | Required in prototype type |
| requestedAt | string | Required in prototype type |
| currentTerms | Draft | Required in prototype type |
| proposedTerms | Draft | Required in prototype type |
| affectedMemberIds | string[] | Required in prototype type |
| consents | { memberId: string ; at: string ; terms: string }[] | Required in prototype type |
| status | "awaiting-consent" / "pending-tcs-review" / "approved-awaiting-consent" / "approved-awaiting-application" / "effective" / "rejected" / "information-required" | Required in prototype type |

### ForceCloseRequest — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| requestedAt | string | Required in prototype type |
| reason | string | Required in prototype type |
| evidenceReference | string | Required in prototype type |
| requestedAbsorptionMinor | number | Required in prototype type |
| status | "pending-tcs-review" / "approved-demo" / "approved" / "rejected" / "information-required" | Required in prototype type |
| balances | { principalMinor: number penaltyMinor: number unpaidPayoutMinor: number exitSettlementMinor: number recoveryMinor: number disputes: string[] } | Required in prototype type |
| affectedMemberIds | string[] | Required in prototype type |

### PayoutFact — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| cycleId | string | Required in prototype type |
| position | number | Required in prototype type |
| memberId | string | Required in prototype type |
| status | "received-demo" / "received-recorded" / "completed-recorded" / "unpaid" / "breach-demo" / "vacant-resolved-demo" | Required in prototype type |
| entitlementMinor | number | Required in prototype type |
| at | string | Optional in prototype type |

### GroupLifecycle — src/lifecycle/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| exits | ExitCase[] | Required in prototype type |
| replacements | Replacement[] | Required in prototype type |
| recoveries | RecoveryCase[] | Required in prototype type |
| amendments | AmendmentRequest[] | Required in prototype type |
| forceCloseRequests | ForceCloseRequest[] | Required in prototype type |
| payoutFacts | PayoutFact[] | Required in prototype type |
| disputes | { id: string cycleId: string exitId?: string review?: import("../operations/review.ts").SourceReview kind: "organization-payout-breach" / "exit-settlement" / "other" status: "open" / "resolved" reason: string }[] | Required in prototype type |
| termination | { review?: SourceReview status: "pending-tcs-review" / "terminated" / "rejected" / "information-required" at: string reason: string } | Optional in prototype type |

### PenaltyAccrual — src/penalties/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| obligationId | string | Required in prototype type |
| componentId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| position | number | Required in prototype type |
| accrualDate | string | Required in prototype type |
| businessAt | string | Required in prototype type |
| principalBasisMinor | number | Required in prototype type |
| dailyRateBps | number | Required in prototype type |
| amountMinor | number | Required in prototype type |
| status | 'ACCRUED' | Required in prototype type |
| recordedAt | string | Required in prototype type |

### PenaltyWaiver — src/penalties/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| accrualId | string | Required in prototype type |
| amountMinor | number | Required in prototype type |
| actor | string | Required in prototype type |
| reason | string | Required in prototype type |
| at | string | Required in prototype type |

### DefaultEvent — src/penalties/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| obligationId | string | Required in prototype type |
| thresholdAt | string | Required in prototype type |
| businessAt | string | Required in prototype type |
| recordedAt | string | Required in prototype type |
| principalOutstandingMinor | number | Required in prototype type |
| recoveryId | string | Required in prototype type |
| status | 'POST_PAYOUT_DEFAULT' | Required in prototype type |

### PenaltyLedger — src/penalties/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| accruals | PenaltyAccrual[] | Required in prototype type |
| waivers | PenaltyWaiver[] | Required in prototype type |
| defaults | DefaultEvent[] | Required in prototype type |

### FinancePolicy — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| source | "explicit-demo-policy" | Required in prototype type |
| settlementHours | number | Required in prototype type |
| tcsOverdueHours | number | Required in prototype type |
| tcsRestrictedHours | number | Required in prototype type |
| expectedProviderFeePercent | number | Optional in prototype type |
| manual | "off" / "organization-confirmed" / "review-required" | Required in prototype type |

### AuditEvent — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| authority | import("../access/model.ts").AuthoritySnapshot | Optional in prototype type |
| at | string | Required in prototype type |
| actor | string | Required in prototype type |
| action | string | Required in prototype type |
| reason | string | Optional in prototype type |
| before | string | Optional in prototype type |
| after | string | Optional in prototype type |

### ProviderSettlement — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| provider | string | Required in prototype type |
| reference | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| settledAt | string | Required in prototype type |
| destination | SettlementAccount | Required in prototype type |
| grossMinor | number | Required in prototype type |
| processingFeeMinor | number | Required in prototype type |
| otherDeductionsMinor | number | Required in prototype type |
| deductionReason | string | Optional in prototype type |
| netMinor | number | Required in prototype type |
| lines | { providerReference: string ; grossMinor: number }[] | Required in prototype type |

### SettlementRecord — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| reconciliationLinks | { providerReference: string; transactionId: string; decisionId: string; at: string; actor: string; reason: string }[] | Optional in prototype type |
| id | string | Required in prototype type |
| receivedAt | string | Required in prototype type |
| status | "matched" / "partially-matched" / "unmatched" / "variance" | Required in prototype type |
| matchedTransactionIds | string[] | Required in prototype type |
| varianceMinor | number | Required in prototype type |
| history | AuditEvent[] | Required in prototype type |

### SettlementExpectation — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| transactionId | string | Required in prototype type |
| groupId | string | Optional in prototype type |
| cycleId | string | Optional in prototype type |
| memberId | string | Required in prototype type |
| provider | string | Required in prototype type |
| providerReference | string | Required in prototype type |
| grossMinor | number | Required in prototype type |
| confirmedAt | string | Required in prototype type |
| expectedFeeMinor | number | Optional in prototype type |
| expectedNetMinor | number | Optional in prototype type |
| dueAt | string | Optional in prototype type |
| matchedGrossMinor | number | Required in prototype type |
| status | "pending" / "delayed" / "partial" / "settled" / "exception" | Required in prototype type |

### FinanceCase — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| adjustment | import("./evidencedRevenue.ts").RecognitionAdjustment | Optional in prototype type |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| groupId | string | Optional in prototype type |
| cycleId | string | Optional in prototype type |
| roundId | string | Optional in prototype type |
| memberId | string | Optional in prototype type |
| transactionId | string | Optional in prototype type |
| settlementId | string | Optional in prototype type |
| payoutId | string | Optional in prototype type |
| obligationId | string | Optional in prototype type |
| lifecycleId | string | Optional in prototype type |
| kind | "fee-adjustment" / "revenue-share" / "amount-mismatch" / "unallocated" / "advance" / "late-optional" / "settlement" / "manual" / "duplicate" / "payout" / "recovery" / "exit" | Required in prototype type |
| amountMinor | number | Required in prototype type |
| reason | string | Required in prototype type |
| sourceReference | string | Optional in prototype type |
| createdAt | string | Required in prototype type |
| status | "open" / "review-required" / "under-review" / "escalated" / "resolved" | Required in prototype type |
| evidence | { name: string ; type: string ; size: number } | Optional in prototype type |
| history | AuditEvent[] | Required in prototype type |

### ManualContribution — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| roundId | string | Required in prototype type |
| memberId | string | Required in prototype type |
| amountMinor | number | Required in prototype type |
| paidAt | string | Required in prototype type |
| recordedAt | string | Required in prototype type |
| actorId | string | Required in prototype type |
| channel | "ordinary-bank-transfer" / "cash" / "approved-offline" | Required in prototype type |
| reference | string | Required in prototype type |
| reason | string | Required in prototype type |
| evidence | { name: string ; type: string ; size: number ; file?: File } | Required in prototype type |
| source | "organization-confirmed-manual" | Required in prototype type |
| status | "allocated" / "review-required" / "rejected" | Required in prototype type |
| allocatedMinor | number | Required in prototype type |

### RevenueReceivable — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| review | SourceReview | Optional in prototype type |
| dueAt | string | Required in prototype type |
| sharePercent | number | Required in prototype type |
| paymentReference | string | Required in prototype type |
| account | RevenueAccount | Required in prototype type |
| paymentStatus | "not-recorded" / "awaiting-confirmation" / "exception" / "settled" | Required in prototype type |
| payments | RevenuePayment[] | Required in prototype type |
| history | AuditEvent[] | Required in prototype type |
| id | string | Required in prototype type |
| organizationId | string | Required in prototype type |
| groupId | string | Required in prototype type |
| cycleId | string | Required in prototype type |
| payoutId | string | Required in prototype type |
| installmentId | string | Required in prototype type |
| recognizedAt | string | Required in prototype type |
| organizationFeeMinor | number | Required in prototype type |
| amountMinor | number | Required in prototype type |
| overdueAt | string | Optional in prototype type |
| restrictedAt | string | Optional in prototype type |
| status | "due" / "overdue" / "restricted" / "settled" | Required in prototype type |
| settlement | { reference: string ; at: string ; actor: string } | Optional in prototype type |

### RevenueAccount — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| bankName | string | Required in prototype type |
| accountName | string | Required in prototype type |
| accountNumber | string | Required in prototype type |
| source | "approved-prototype-configuration" | Required in prototype type |

### RevenuePayment — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| amountMinor | number | Required in prototype type |
| bankChargeMinor | number | Required in prototype type |
| transferredAt | string | Required in prototype type |
| bankName | string | Required in prototype type |
| bankReference | string | Required in prototype type |
| evidence | {name: string; type: string; size: number; file?: File} | Optional in prototype type |
| recordedAt | string | Required in prototype type |
| recordedBy | string | Required in prototype type |
| account | RevenueAccount | Required in prototype type |
| paymentReference | string | Required in prototype type |
| status | "awaiting-confirmation" / "exception" / "confirmed" | Required in prototype type |
| confirmedBy | string | Optional in prototype type |
| confirmedAt | string | Optional in prototype type |

### ReconciliationState — src/reconciliation/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| payoutRecognitions | import("./evidencedRevenue.ts").EvidencedRecognition[] | Optional in prototype type |
| revenueAccount | RevenueAccount | Optional in prototype type |
| organizationId | string | Required in prototype type |
| policy | FinancePolicy | Optional in prototype type |
| referenceAt | string | Optional in prototype type |
| expectations | SettlementExpectation[] | Required in prototype type |
| settlements | SettlementRecord[] | Required in prototype type |
| unmatchedPayments | ProviderConfirmation[] | Required in prototype type |
| cases | FinanceCase[] | Required in prototype type |
| receivables | RevenueReceivable[] | Required in prototype type |
| history | AuditEvent[] | Required in prototype type |

### CaseEvent — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| at | string | Required in prototype type |
| actor | string | Required in prototype type |
| action | string | Required in prototype type |
| reason | string | Optional in prototype type |
| before | string | Optional in prototype type |
| after | string | Optional in prototype type |
| authority | AuthoritySnapshot | Optional in prototype type |
| origin | "Source" / "Internal" | Required in prototype type |

### Evidence — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| name | string | Required in prototype type |
| detail | string | Optional in prototype type |
| file | File | Optional in prototype type |

### ContextField — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| label | string | Required in prototype type |
| value | string | Required in prototype type |

### OperationsCase — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| disputeProcesses | import("../payouts/model.ts").PayoutDispute[] | Optional in prototype type |
| review | SourceReview | Optional in prototype type |
| id | string | Required in prototype type |
| reference | string | Required in prototype type |
| type | string | Required in prototype type |
| category | "Reviews" / "Financial Exceptions" / "Disputes / Escalations" | Required in prototype type |
| module | "Clients" / "Organizations" / "Thrift" / "Payments" | Required in prototype type |
| organizationId | string | Optional in prototype type |
| organization | string | Optional in prototype type |
| memberId | string | Optional in prototype type |
| member | string | Optional in prototype type |
| groupId | string | Optional in prototype type |
| cycleId | string | Optional in prototype type |
| roundId | string | Optional in prototype type |
| referenceAt | string | Optional in prototype type |
| amountMinor | number | Optional in prototype type |
| reason | string | Required in prototype type |
| createdAt | string | Required in prototype type |
| sourceStatus | string | Required in prototype type |
| status | CaseStatus | Required in prototype type |
| priority | Priority | Required in prototype type |
| assignee | string | Optional in prototype type |
| related | { paymentId?: string settlementId?: string payoutId?: string applicationId?: string lifecycleId?: string obligationId?: string } | Optional in prototype type |
| source | { id: string; label: string; kind: string } | Required in prototype type |
| context | ContextField[] | Required in prototype type |
| financial | ContextField[] | Required in prototype type |
| evidence | Evidence[] | Required in prototype type |
| timeline | CaseEvent[] | Required in prototype type |
| policy | string | Required in prototype type |
| nextAction | string | Required in prototype type |
| resolvedAt | string | Optional in prototype type |

### Triage — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| status | CaseStatus | Optional in prototype type |
| priority | Priority | Optional in prototype type |
| assignee | string | Optional in prototype type |
| timeline | CaseEvent[] | Required in prototype type |

### CaseFilters — src/operations/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| view | string | Optional in prototype type |
| search | string | Optional in prototype type |
| status | string | Optional in prototype type |
| priority | string | Optional in prototype type |
| module | string | Optional in prototype type |
| type | string | Optional in prototype type |
| organizationId | string | Optional in prototype type |
| assignment | string | Optional in prototype type |
| olderThanHours | number | Optional in prototype type |

### RestrictionRecord — src/operations/interventionModel.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| targetId | string | Required in prototype type |
| target | 'Member' / 'Organization' | Required in prototype type |
| type | 'new-activity' / 'suspension' / 'post-payout-default' | Required in prototype type |
| sourceCaseId | string | Required in prototype type |
| reason | string | Required in prototype type |
| startedAt | string | Required in prototype type |
| authority | string | Required in prototype type |
| scope | string | Required in prototype type |
| reviewStatus | 'active' / 'released' | Required in prototype type |
| releasedAt | string | Optional in prototype type |
| releasedBy | string | Optional in prototype type |
| removalReason | string | Optional in prototype type |

### EvidenceRequest — src/operations/interventionModel.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| party | 'Member' / 'Organization' | Required in prototype type |
| requested | string | Required in prototype type |
| at | string | Required in prototype type |
| deadline | string | Required in prototype type |
| responses | { at: string; actor: string; statement: string; evidence: string[] }[] | Required in prototype type |
| missedAt | string | Optional in prototype type |

### DisputeResolution — src/operations/interventionModel.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| at | string | Required in prototype type |
| reviewerId | string | Required in prototype type |
| outcome | 'member-upheld' / 'organization-accepted' / 'partial-receipt' | Required in prototype type |
| receivedMinor | number | Required in prototype type |
| reason | string | Required in prototype type |
| evidence | string[] | Required in prototype type |
| phase | 'initial' / 'appeal' / 'exceptional' | Required in prototype type |

### DisputeProcess — src/operations/interventionModel.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| policy | { source: 'prototype-policy'; evidenceHours: number; appealHours: number; decideOnAvailableEvidence: boolean } | Required in prototype type |
| requests | EvidenceRequest[] | Required in prototype type |
| resolutions | DisputeResolution[] | Required in prototype type |
| appeal | { at: string; actor: string; party: 'Member' / 'Organization'; reason: string; evidence: string[]; outcomeId?: string; reviewerId?: string; finalizedAt?: string } | Optional in prototype type |
| appealDeadline | string | Optional in prototype type |
| finalizedAt | string | Optional in prototype type |
| reopenings | { at: string; actor: string; reason: string; previousFinalizedAt: string }[] | Required in prototype type |
| stage | 'investigation' / 'appeal-available' / 'appeal-pending' / 'final' / 'exceptionally-reopened' | Required in prototype type |

### InternalUser — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| security | { locked:boolean; lockedAt?:string; lockReason?:string; failedAttempts:number; lastFailureAt?:string; lastSuccessAt?:string; unlockedAt?:string } | Optional in prototype type |
| id | string | Required in prototype type |
| name | string | Required in prototype type |
| identifier | string | Required in prototype type |
| status | UserStatus | Required in prototype type |
| roleIds | string[] | Required in prototype type |
| createdAt | string | Required in prototype type |
| createdBy | string | Required in prototype type |
| activatedAt | string | Optional in prototype type |
| suspendedAt | string | Optional in prototype type |
| deactivatedAt | string | Optional in prototype type |
| reason | string | Optional in prototype type |

### Role — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| name | string | Required in prototype type |
| purpose | string | Required in prototype type |
| active | boolean | Required in prototype type |
| baseline | boolean | Required in prototype type |
| permissions | string[] | Required in prototype type |

### AuthoritySnapshot — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| userId | string | Required in prototype type |
| name | string | Required in prototype type |
| roles | { id: string; name: string }[] | Required in prototype type |
| permissions | string[] | Required in prototype type |

### AccessEvent — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| action | string | Required in prototype type |
| actor | AuthoritySnapshot | Required in prototype type |
| target | string | Required in prototype type |
| at | string | Required in prototype type |
| reason | string | Required in prototype type |
| before | unknown | Required in prototype type |
| after | unknown | Required in prototype type |
| privileged | boolean | Required in prototype type |

### AccessState — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| security | { sessions:SecuritySession[]; events:SecurityEvent[] } | Optional in prototype type |
| users | InternalUser[] | Required in prototype type |
| roles | Role[] | Required in prototype type |
| history | AccessEvent[] | Required in prototype type |

### SecuritySession — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| userId | string | Required in prototype type |
| status | 'Active' / 'Expired' / 'Revoked' | Required in prototype type |
| createdAt | string | Required in prototype type |
| lastActivityAt | string | Required in prototype type |
| expiresAt | string | Required in prototype type |
| device | string | Required in prototype type |
| network | string | Required in prototype type |
| trust | 'Trusted demo device' / 'New device' / 'Untrusted demo device' | Required in prototype type |
| revokedAt | string | Optional in prototype type |
| revokedBy | string | Optional in prototype type |
| reason | string | Optional in prototype type |
| auditId | string | Optional in prototype type |

### SecurityEvent — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| type | string | Required in prototype type |
| userId | string | Optional in prototype type |
| actor | AuthoritySnapshot | Optional in prototype type |
| at | string | Required in prototype type |
| result | string | Required in prototype type |
| reason | string | Required in prototype type |
| context | string | Optional in prototype type |
| sessionId | string | Optional in prototype type |
| accessChangeId | string | Optional in prototype type |
| before | unknown | Optional in prototype type |
| after | unknown | Optional in prototype type |

### InternalSession — src/access/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| kind | "tcs-internal" | Required in prototype type |
| personaId | string | Required in prototype type |
| access | AccessState | Required in prototype type |

### Change — src/settings/service.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| category | "Business Date" / "Runtime Control" | Required in prototype type |
| action | string | Required in prototype type |
| before | string | Required in prototype type |
| after | string | Required in prototype type |
| actor | string | Required in prototype type |
| actorId | string | Required in prototype type |
| reason | string | Required in prototype type |
| at | string | Required in prototype type |
| environment | Environment | Required in prototype type |
| priorMode | Mode | Optional in prototype type |
| priorDate | string | Optional in prototype type |
| newMode | Mode | Optional in prototype type |
| newDate | string | Optional in prototype type |
| key | string | Optional in prototype type |
| previousValue | string | Optional in prototype type |
| newValue | string | Optional in prototype type |

### SettingsState — src/settings/service.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| environment | Environment | Required in prototype type |
| mode | Mode | Required in prototype type |
| controlledDate | string / null | Required in prototype type |
| revision | number | Required in prototype type |
| history | readonly Change[] | Required in prototype type |
| verificationMode | "EMAIL" / "PHONE" / "BOTH" | Required in prototype type |

### Preview — src/settings/service.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| request | Request | Required in prototype type |
| reason | string | Required in prototype type |
| revision | number | Required in prototype type |
| actorId | string | Required in prototype type |
| before | string | Required in prototype type |
| after | string | Required in prototype type |
| action | string | Required in prototype type |
| direction | string | Required in prototype type |
| warnings | string[] | Required in prototype type |
| protectedThrough | string | Required in prototype type |
| actualDate | string | Required in prototype type |

### Counts — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| evaluated | number | Required in prototype type |
| changed | number | Required in prototype type |
| skipped | number | Required in prototype type |
| failed | number | Required in prototype type |

### StepResult — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| key | StepKey | Required in prototype type |
| name | string | Required in prototype type |
| status | Status | Required in prototype type |
| startedAt | string | Required in prototype type |
| completedAt | string | Required in prototype type |
| errors | string[] | Required in prototype type |
| notes | string[] | Required in prototype type |

### Run — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| id | string | Required in prototype type |
| definition | typeof processDefinition | Required in prototype type |
| startedAt | string | Required in prototype type |
| completedAt | string | Required in prototype type |
| businessDate | string | Required in prototype type |
| businessTimestamp | string | Required in prototype type |
| mode | Mode | Required in prototype type |
| environment | Environment | Required in prototype type |
| actor | AuthoritySnapshot | Required in prototype type |
| trigger | 'MANUAL' | Required in prototype type |
| reason | string | Required in prototype type |
| status | Status | Required in prototype type |
| steps | StepResult[] | Required in prototype type |
| retryOf | string | Optional in prototype type |
| errors | string[] | Required in prototype type |

### ProcessState — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| runs | readonly Run[] | Required in prototype type |
| revision | number | Required in prototype type |
| running | boolean | Required in prototype type |

### ProcessWorld — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| groups | ThriftGroup[] | Required in prototype type |
| finance | ReconciliationState | Optional in prototype type |

### ProcessSources — src/processes/model.ts

| Field | Prototype value shape | Presence |
| --- | --- | --- |
| worlds | ProcessWorld[] | Required in prototype type |
| organizations | Organization[] | Required in prototype type |
| banks | BankDirectory | Required in prototype type |

