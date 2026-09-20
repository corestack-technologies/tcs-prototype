# TCS v1 Settings Catalogue

TCS Prototype v1 production handoff. Requirements describe the approved build contract, not infrastructure already delivered.

Only implemented controls are runtime settings. A broad constitutional configuration hierarchy does not imply every possible knob has a screen or API today.

| Control / surface | Values / scope | Authority / effect |
| --- | --- | --- |
| CLIENT_VERIFICATION_MODE | EMAIL, PHONE, BOTH; environment/platform; default BOTH | settings.view + settings.runtime_controls.manage; subsequent onboarding contact eligibility, not KYC approval |
| Business Date | REAL_TIME or non-production CONTROLLED local date | settings.view + settings.business_date.manage; preview/history guard; no implicit process run; production controlled mode forbidden |
| Configuration history | Actual before/after records, actor/reason/environment | settings.view + settings.audit.view; Business Date rows also require settings.business_date.view |
| Diagnostics | Read-only source/system health view | settings.view + settings.diagnostics.view; no repair button or secret disclosure |
| Group/Cycle terms | Fee, schedule, accepted penalty rate and participation policies | Owned draft and readiness/reconfirmation rules; activated snapshot locks terms |
| Demo financial boundaries/windows | Explicit fixture fee boundaries, payout/dispute/share policies | Prototype scenario configuration, not automatically a platform Settings control or approved universal production value |

The penalty daily-rate ceiling is 10 bps/day with Group range 0–10, subject to production policy review. Seven full local calendar days after grace expiry is the frozen Post-Payout Default threshold. Do not silently expose these as new runtime controls. Source: src/settings/service.ts; src/groups/model.ts; src/penalties/policy.ts; src/payouts/model.ts.

