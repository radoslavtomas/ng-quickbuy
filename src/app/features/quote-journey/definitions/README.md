# Field schemas

Each file under `motor/steps/` and `property/steps/` exports an array or factory of
`FormFieldConfig`. The adjacent `motor/motor.journey.ts` and `property/property.journey.ts`
compose these fields into step sections, so step field files describe **questions only** —
never order, routing or defaults.

- Step order and step metadata live in `<journey>/<journey>.journey.ts`.
- A section's starting values live on that section's `defaults` in the same file.
- Which products exist and which journey they run lives in `core/config/module-catalogue.ts`.

For how to add a field, a step, a section or a product, see the recipes in the root `README.md`.

## Field naming

Use readable internal camelCase names such as `forenames`, `dateOfBirth`, and `startDate`.
`../persistence/journey-payload.mapper.ts` owns the translation to insurer keys
and coded values. Renaming a UI field must be reflected in the mapper, but a backend contract
change should not require renaming the field.

Field names only need to be unique **within a section**. Answers are stored per module, step and
section, so two steps may reuse a name without colliding. `declarationAccepted` legitimately exists
in both motor `your-policy` and property `assumptions`.

## Shared questions and custom sections

`shared/occupation.fields.ts` defines occupation questions reused for the proposer, additional
drivers, and joint proposer. Shared option lists live under `shared/lookups/`.
Address fields belong to `../sections/address/address.fields.ts`, beside their bespoke lookup UI.
Vehicle field factories and mappings live under `motor/`; the search UI lives under
`../sections/vehicle-search/`. Demo quote fixtures live under `../sections/quote-results/`,
not alongside question configuration.

## Options and coded values

Option `value`s are the internal representation, which may differ from what the backend sends.
The payload mapper owns both directions (for example `coverType: comprehensive` becomes
`policy-cover: C`). `../persistence/quote-recall-hydration.service.ts` uses that same mapper to
restore answers, so a new coded field needs its options here and its translation in the mapper.
