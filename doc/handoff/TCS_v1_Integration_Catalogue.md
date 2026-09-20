# TCS v1 Integration Catalogue

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

Source direction: the retained TCS_V1_Building_Strategy.docx (15 September 2026), Constitution Chapter 31 and Stage 8 specification. The providers below are project directions, not claims of verified current provider capability, pricing or legal approval. No integration is implemented in this stage.

| Integration | Required behaviour / development direction | Unresolved production validation / acceptance evidence |
| --- | --- | --- |
| Paystack / payment provider | Test-mode initialization where applicable, trusted webhook ingest, transaction verification/requery, account resolution, transaction/settlement reconciliation | Provider approval of thrift/B2B2C and multi-Organization model; Organization onboarding and settlement routing; confirm no TCS custody; verify fees, gross/net, reversals/refunds/disputes and retry semantics |
| DVA / subaccounts | Evaluate collection account and Organization settlement architecture; isolate provider identifiers behind adapter | Member vs Member–Organization vs Member–Group scope; DVA eligibility/limits; subaccount feasibility, settlement ownership and account lifecycle require provider confirmation. Prototype member-organization-demo scope is not an architecture approval |
| Email | Mailtrap sandbox for development/UAT; EmailProvider abstraction | Select transactional production provider; domain authentication, delivery/bounce status, retry limits and protected templates |
| SMS | Africa's Talking sandbox/development direction through SmsProvider | Production provider selection/commercial activation (strategy permits selected alternative); delivery evidence, sender/OTP restrictions, cost and fallback decisions |
| WhatsApp | Meta WhatsApp Business Platform test setup through WhatsAppProvider | Approved templates where required, explicit opt-in/preferences, delivery/status webhooks, credential activation and permitted message policies; V1 production channel, not post-V1 |
| Identity / KYC | Provider-neutral verification and evidence integration | Select provider only after coverage, lawful data handling, response states, manual review/escalation and commercial validation; do not assume NIN/BVN storage entitlement |
| Bank/account resolution | Validate beneficiary and Organization settlement account identity before use | Trusted resolution result, freshness, change review, failure handling and immutable instruction snapshots |
| Object storage | Private KYC documents, payout and dispute evidence; immutable metadata/version references | Access-controlled upload/download, content/size/type checks, malware scanning, encryption, expiry and retention policy; no public evidence URLs |

Keep provider secrets on backend only. Verify callbacks before effects, deduplicate events and retain provider facts separately from business allocations. Reconciliation must detect missing/duplicate/conflicting evidence rather than silently settle mismatches. Production notification consent/templates and settlement architecture are launch dependencies, not new prototype features.

