# Field schemas

Each file under `motor/steps/` and `property/steps/` exports one plain array of
`FormFieldConfig`. Journey definitions in `features/modules/journeys/` compose these arrays into
step sections, so these files describe **questions only** — never order, routing or defaults.

- Step order and step metadata live in `<journey>.journey.ts`.
- A section's starting values live on that section's `defaults` in the same file.
- Which products exist and which journey they run lives in `core/config/module-catalogue.ts`.

For how to add a field, a step, a section or a product, see the recipes in the root `README.md`.

## Field naming

Use the backend/recall key as `name` wherever it is known, because it is what the API expects and
what a recall response returns:

```
proposer-name-forenames    proposer-dateofbirth    proposer-email
vehicle-regnumber          policy-inceptiondate    policy-volxs
```

Where no backend key is known yet, use camelCase (`propertyType`, `buildingsSumInsured`) and treat it
as provisional — it will change when the contract is confirmed.

Field names only need to be unique **within a section**. Answers are stored per module, step and
section, so two steps may reuse a name without colliding. `declarationAccepted` legitimately exists
in both motor `your-policy` and property `assumptions`.

## Aliases are temporary

`metadata.aliases` lets a recall response using a legacy camelCase key hydrate a field that has since
been renamed to its backend key:

```ts
{ name: 'proposer-name-forenames', metadata: { aliases: ['firstName'] } }
```

Only `QuoteRecallHydrationService` reads them. They exist for migration and should be deleted once
the payload mapper owns the translation between the internal model and the insurer contract — that
mapper is the planned replacement for this whole convention, at which point field names become
internal and stop doubling as backend keys.

## Options and coded values

Option `value`s are the internal representation, which is usually not what the backend sends. Where
the backend uses codes, the translation lives in `FIELD_VALUE_MAPPING` in
`services/quote-recall-hydration.service.ts` (for example `policy-cover: C -> comprehensive`). Keep
the two in step: a new coded field needs both the options here and the mapping there.
