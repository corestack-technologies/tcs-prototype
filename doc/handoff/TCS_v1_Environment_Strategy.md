# TCS v1 Environment Strategy

Production handoff for frozen TCS Prototype v1. No production implementation is performed in Stage 8.

| Environment | Data / credentials / providers | Storage / notifications | Business Date / promotion |
| --- | --- | --- | --- |
| Local development | Isolated local database; seeded non-real identities; separate test credentials; Paystack test mode direction | Private development storage; Mailtrap and SMS/Meta test recipients only | Controlled clock only where explicitly enabled and authorized; reproducible reset/migrations |
| UAT / staging | Separate database and credentials from local and Production; provider test/sandbox modes; representative protected test data | Separate private bucket and signed access; Mailtrap, Africa's Talking sandbox, Meta test setup; no uncontrolled real-recipient sends | Authorized non-production Business Date; test forward/rewind protection and durable process replay; same release candidate configuration shape |
| Production | Dedicated database, least-privilege live credentials and validated provider architecture; no prototype seed accounts | Private production storage; approved transactional providers/templates and consent; backups/monitoring | Server-enforced real-time clock only; no demo personas or controlled date; promote reviewed tested artifact/migrations with rollback plan |

Never copy production secrets or unrestricted personal data into local/UAT. Separate provider webhook endpoints and signing secrets, storage keys, notification identities and logs. Configuration must make environment/mode explicit; reject accidental live provider use in sandbox.

Promote a tested release artifact rather than rebuilding unreviewed source independently. Validate database migrations and backups, run UAT, complete required external readiness decisions, then begin a limited monitored pilot. Prototype Preview is a fourth, separate demo purpose: static simulated data and no live credentials; it is not a Production environment.

