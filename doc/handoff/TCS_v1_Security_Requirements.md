# TCS v1 Security Requirements

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

Prototype persona switching, local credentials, sample OTP, simulated sessions and account locks are test mechanisms. None may authorize production access. The requirements below preserve product authority while replacing simulated infrastructure.

| Area | Production requirement | Acceptance evidence |
| --- | --- | --- |
| Authentication | Choose managed auth or secure password strategy; verified contact recovery; never ship demo any-password login | Registration/recovery/expiry tests, rate limits and no demo entry in production |
| Session / JWT | Decide token/session design deliberately; safe storage, expiry, rotation where applicable, logout and server-side revocation | Revoked/expired sessions denied across API and privileged actions; browser refresh cannot manufacture identity |
| MFA | Apply appropriate stronger authentication to privileged accounts/actions; define enrollment and recovery policy | Privileged flow and lost-factor recovery tested without a self-escalation bypass |
| RBAC | Server-side exact catalogue permissions, active unlocked user, active roles; default deny | Forged persona/tenant/role payload rejected; suspended user and unknown key denied |
| Separation of duty | No direct/indirect self-escalation; preserve last effective Access Admin; independent appeals and beneficial Owner exception review | Stale previews, role mutation and original appeal reviewer rejected |
| Session revocation / lockout | Durable security events, account lock and session revocation with explicit security permissions | Unlock does not grant roles; revoke affects real sessions; bounded login attempts |
| Secrets / encryption | Backend-managed secrets, separate environment credentials, TLS and appropriate at-rest encryption | No privileged key in browser bundle/logs; rotation procedure tested |
| PII / KYC | Least-privilege access, private evidence storage, minimization and approved retention | Cross-tenant and unauthenticated file access denied; no NIN/document leakage in reports or notifications |
| Webhooks | Verify authenticity and transaction facts, reject replay/conflict, deduplicate; no client-success callback as authority | Forged/duplicate/out-of-order events cannot duplicate or falsely recognize money |
| Audit | Immutable privileged and financial before/after with authority snapshot; restricted read access and retention | Later role edits cannot rewrite past decisions; source and audit commit together |
| API / browser | Input validation, rate limiting, secure file upload, CSRF/XSS protections appropriate to auth strategy | Malformed amounts, uploaded active content, formula-injection exports and unauthorized actions tested |
| Monitoring / recovery | Redacted logs, incident response, backup/restore and security review before pilot | Recovery exercise and external readiness sign-off; no claim of live security from prototype checks |

Regulatory/legal and privacy obligations must be validated by the responsible advisers before real-money launch. This handoff records the need for that review; it does not supply a legal determination or fixed retention period.

