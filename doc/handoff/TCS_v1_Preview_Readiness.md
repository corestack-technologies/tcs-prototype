# TCS Prototype v1 Preview Readiness

This is an optional **Prototype Preview**, not a production release. No deployment, push or live provider configuration was performed.

The existing HTML title now reads **TCS Prototype v1**. The compact Use demo account selector retains Member, Organization and TCS Internal groups; no separate Internal access entry was added. Existing simulation notices remain visible. Do not enter real identity documents, bank details or live credentials into this demo.

`vercel.json` uses `npm run build`, the `dist` output directory, filesystem-first asset serving and an SPA fallback to `/index.html`. This supports refreshing the explicitly recognized initial routes while preserving static asset delivery. It does not turn every in-memory View into a URL route or bypass application permissions.

Validated locally against the built application on `127.0.0.1:8444`:

- HTTP 200 with the correct application title for `/`, `/operations`, `/access-management`, `/access-management/security`, `/reports/member`, `/reports/organization`, `/reports/internal`, `/settings`, `/settings/diagnostics`, `/operations/scheduled-processes`.
- All 49 generated assets returned HTTP 200.
- The Vite production build and bundle dependency check passed; deferred workspaces remain dynamically loaded.
- A targeted built HTML/JS/CSS scan found no private-key blocks or recognized provider/AWS/GitHub secret patterns. Source environment usage is limited to Vite SSR selection and the server port; `.env.example` contains placeholder app/API values. This is a scoped check, not a comprehensive secret-security certification.

Vercel configuration is prepared locally; remote Vercel routing and deployment have not been tested because deployment is explicitly out of scope. HTTP shell checks verify serving, not interactive rendering or authorization. Internal route access remains a demo identity simulation and must never be represented as production security.

If the product owner later authorizes deployment, use a clearly named prototype project, retain the simulation boundary and verify the listed routes/assets on that deployment. Production credentials and databases must not be attached. Refresh still resets in-memory prototype state; follow the Demo Guide preparation checklist for presentations.
