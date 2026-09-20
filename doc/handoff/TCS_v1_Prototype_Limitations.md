# TCS Prototype v1 Limitations and Production Boundaries

Production handoff for frozen TCS Prototype v1. No production implementation is performed in Stage 8.

The frozen artifact is an executable product reference, not production software. Automated validation demonstrates current domain behaviour and render contracts, not deployed operational readiness.

- No persistent database or real backend API; session refresh resets in-memory changes and added scenarios.
- No production authentication, credential recovery, MFA or security/session infrastructure. Internal demo users are not real authorization identities.
- No live payment movement, settlement, provider KYC, private object storage or live Email/SMS/WhatsApp. Demo bank/account data and File objects are simulated.
- No durable scheduler, distributed locks, production retry workers, monitoring, backups or deployment infrastructure.
- No completed regulatory/legal/provider approval is implied. Non-custody is the product direction; provider architecture and contractual readiness require validation.
- Discovery/join screens include legacy fixtures separate from the shared financial Group pipeline; production must connect them. Dashboard historical sample aggregates are not totals of newly prepared financial scenarios.
- Some Recovery and payout history fixtures contain aggregate/received-demo facts rather than dated provider evidence. Production must persist explicit receipts/allocations and cannot invent missing dates.
- Financial scenario clocks intentionally use future schedules; they are isolated from environment-clock processing. Repeated payout fixtures may reuse a Group name; identify by source ID.
- Many views are in-memory aliases, not refreshable deep links. Only the ten documented initial URL entries resolve to their intended shell/context; authorization and source context still apply.
- Six target widths have structural checks, but interactive browser and real-device visual approval remain unverified. The Auth illustration remains an intentional prototype visual asset, not a commissioned final production graphic.
- Approved business obligations such as closure clearance and exceptional succession still require production persistence, legal procedure and connected source checks; prototype sample clearance is not launch evidence.

These limitations are known implementation boundaries, not permission to change the approved financial/lifecycle rules. See Integration, Data, Security, Environment and Process Requirements for production work. See Post_V1_Backlog.md for genuinely deferred features; V1 Email/SMS/WhatsApp and real persistence/security are not deferred features.

