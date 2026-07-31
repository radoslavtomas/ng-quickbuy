# Specific Module Config Structure

This folder contains journey config split by journey, module, and step.

## Layout

- `shared/common.ts`
  - shared constants (`DEMO_QUOTES`, address fields, UI style helpers)
  - migration helpers (`applyFieldAliases`)
- `motor/`
  - `step-order.config.ts`
  - `default-values.config.ts`
  - `modules.ts`
  - `steps/*.fields.ts`
- `property/`
  - `step-order.config.ts`
  - `default-values.config.ts`
  - `modules.ts`
  - `steps/*.fields.ts`

## Naming Strategy

- Canonical field names should match backend/recall keys where known.
- Example: `proposer-name-forenames`, `vehicle-regnumber`, `policy-inceptiondate`.
- Legacy app keys are supported temporarily through `metadata.aliases`.

## How to Add a New Field

1. Add it to the relevant `steps/*.fields.ts` file.
2. If backend key is known, use that as `name`.
3. If migrating from a legacy key, add `metadata.aliases`.
4. Update corresponding defaults in `default-values.config.ts`.

## How to Add a New Module Variant

1. Add module code in `modules.ts` for the journey.
2. Add/override step field arrays for that module.
3. Add module default value set if different from shared defaults.

## Temporary Compatibility

- `metadata.aliases` exists for migration only.
- Remove aliases when legacy keys are no longer present in workflow state or recall payload handling.
