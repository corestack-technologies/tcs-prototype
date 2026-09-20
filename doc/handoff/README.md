# TCS Prototype v1 Production Handoff

Start with the [Freeze record](../TCS_Prototype_v1_Freeze.md), [Constitution v1.0](../constitution/TCS_Product_Constitution_v1.0.md) and [Demo Guide](../TCS_Prototype_v1_Demo_Guide.md). Product discovery/prototyping is closed. This package specifies production work; it does not implement or declare production readiness.

## Product contract

- [Product inventory](TCS_Prototype_v1_Product_Inventory.md)
- [Route and screen inventory](TCS_v1_Route_Screen_Inventory.md) — all 62 View identifiers and their initial-URL distinction.
- [Domain model](TCS_v1_Domain_Model.md)
- [Field and data dictionary](TCS_v1_Field_Data_Dictionary.md) — extracted declared fields plus validation/lifecycle ownership rules.
- [State transitions](TCS_v1_State_Transition_Catalogue.md)
- [Permission matrix](TCS_v1_Permission_Matrix.md) — all 52 exact permission keys and seeded grants.
- [API requirements](TCS_v1_API_Requirements.md) — A01–A23 action capability groups.
- [Settings catalogue](TCS_v1_Settings_Catalogue.md)
- [Report catalogue](TCS_v1_Report_Catalogue.md) — all 32 catalogue entries.

## Production requirements

- [Integrations](TCS_v1_Integration_Catalogue.md)
- [Notifications](TCS_v1_Notification_Requirements.md)
- [Data persistence](TCS_v1_Data_Requirements.md)
- [Processes and scheduler](TCS_v1_Production_Process_Requirements.md)
- [Security](TCS_v1_Security_Requirements.md)
- [Environment strategy](TCS_v1_Environment_Strategy.md)
- [Frontend strategy](TCS_v1_Frontend_Production_Strategy.md)
- [Vertical build sequence and building-strategy alignment](TCS_v1_Production_Build_Sequence.md)

## Acceptance and boundaries

- [UAT acceptance](TCS_v1_UAT_Acceptance_Catalogue.md) — U01–U26.
- [Rule-to-acceptance traceability](TCS_v1_Traceability_Matrix.md)
- [Validation evidence](TCS_v1_Freeze_Validation.md)
- [Prototype limitations](TCS_v1_Prototype_Limitations.md)
- [Optional preview readiness](TCS_v1_Preview_Readiness.md)
- [Post-V1 backlog](../Post_V1_Backlog.md)
- [Source manifest](TCS_Prototype_v1_Source_Manifest.json) — hashes identify the local application/test/configuration content without committing it.

The historical v0.3 Constitution and original Building Strategy DOCX remain unchanged. Earlier module validation counts are historical; the Stage 8 validation record is the current freeze evidence. A baseline role's display name never substitutes for the exact permission matrix. Representative UAT scenarios do not claim live integrations already exist.
