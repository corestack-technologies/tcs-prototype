# TCS v1 Notification Requirements

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

Build one provider-neutral NotificationService with EmailProvider, SmsProvider and WhatsAppProvider adapters, plus in-app history where appropriate. Email/SMS/WhatsApp are V1 production scope. The prototype does not send live notifications.

Channel preferences below are delivery-planning requirements, not a claim that template wording/cadence or production consent policy is finalized. Each external template needs approved wording/version, locale, variables and privacy review. Explicit WhatsApp opt-in is required; honor channel preferences and distinguish service/security necessity from optional messaging. Fallback must use an authorized channel and must not bypass consent.

| Event | Recipient | Purpose | Preferred channels | Template / critical fallback considerations |
| --- | --- | --- | --- | --- |
| Contact verification / security challenge | Member | Verify controlled contact/session action | Email/SMS according to configured mode | Short-lived single-use code template; no sensitive profile; rate-limited resend; WhatsApp OTP only if separately validated |
| KYC submitted / decision / information required | Member | State, required next action and protected evidence link | In-app + Email; consented SMS/WhatsApp for action reminder | Decision/status template; never include identity document or NIN; fallback for outstanding action |
| Organization application / decision | Owner | Submission, approval/decline or information response | In-app + Email; consented WhatsApp/SMS | Application template; authenticated deep link; no promise approval equals active workspace |
| Group invitation / join decision / reconfirmation | Invited/requesting/affected Member | Participation offer and exact terms revision requiring acceptance | In-app + Email or consented WhatsApp | Invitation/decision template; expiry and terms link; delivery is not acceptance |
| Contribution due / reminder | Obligated Member | Required amount and due date | In-app + consented WhatsApp/SMS; Email | Due template with Group context; exclude skipped optional component; dedupe per due/reminder event |
| Contribution confirmation / exception | Paying Member; Owner where relevant | Recognized payment or required exception action | In-app + Email/consented WhatsApp | Confirmation must follow trusted event; settlement pending is separate; no false failure for money received |
| Late / formal default | Affected Member; responsible Owner | Required debt, next action and applicable restriction | In-app + Email; consented SMS/WhatsApp fallback | Late/default distinct templates; private debt not broadcast to other Organizations |
| Payout ready | Organization Owner | Ready beneficiary and next manual transfer action | In-app + Email/consented WhatsApp | Readiness template; protected bank-details link; no auto-transfer implication |
| Payout recorded / confirmation reminder | Beneficiary | Review externally recorded transfer and confirm or dispute | In-app + Email/consented WhatsApp; SMS fallback | Recorded/reminder templates; no claim receipt is confirmed; preserve deadlines |
| Dispute / evidence / appeal outcome | Relevant Member and Owner; assigned Internal reviewer | Evidence deadline, decision and permitted appeal action | In-app + Email; consented SMS/WhatsApp reminder | Status/evidence template; protected attachments; deadline expiry not inferred from delivery |
| Recovery receipt / clearance review | Affected Member and responsible Owner | Recognized allocation, remaining balance or review action | In-app + Email/consented WhatsApp | Principal/penalty distinction; payment does not silently remove all restrictions |
| Exit Settlement due / resolved | Outgoing Member and Owner | Organization liability and settlement evidence | In-app + Email/consented WhatsApp | Exit template; separate from Member default |
| Security alert / privileged access change | Affected Internal user or Member; authorized security actor | Suspicious event or material access/session action | Email + appropriate in-app history; validated fallback | Minimal context; no password/token; do not notify unrelated recipients |
| Process failure / operational attention | Authorized operator/support audience | Failed/partial run requiring review | Operational alert channel and scoped history | Run/reference/error summary; redact payload; route by responsibility, not every user |

Persist committed event ID, recipient, template version, channel consent at dispatch, attempts, provider reference and delivery/status callbacks. Do not send before source transaction commits. Deduplicate retries; delivery is not proof of payment, receipt or Member consent. Failed delivery must remain observable without blocking authoritative financial state. Define cadence and escalation limits during the corresponding production slice; do not invent a new product SLA from demo timestamps.

