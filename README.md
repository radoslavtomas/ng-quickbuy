# NG QuickBuy

NG QuickBuy is an Angular 22 quote-journey prototype for insurance products.
It supports multi-brand journeys, module-based routing, dynamic schema-driven forms, and a demo quote outcome screen.

The current implementation focuses on proving the end-to-end UX and architecture for quote capture:

- brand-aware experience by hostname
- module and step routing
- reusable form engine with conditional logic and normalization
- journey state persistence across steps
- address lookup with manual-entry fallback
- demo quote generation from submitted inputs

## Project Status (So Far)

This project is currently a functional front-end prototype:

- customer journeys for motor and property flows are implemented
- core validation, navigation, and state orchestration are in place
- external API integration currently includes address lookup
- quote results are demo/mock data (not a live insurer pricing integration yet)

## Feature Overview

### 1. Multi-Brand Configuration

Brand behavior is config-driven.
At runtime, the app detects the current hostname and selects a brand profile (for example Quoteline Direct, ChoiceQuote, or AJG) with:

- brand colors
- logo assets
- phone number and footer content
- allowed product modules

This allows one codebase to power multiple branded experiences.

### 2. Module and Journey Routing

Routes are structured around module codes and optional step segments:

- home: `/`
- module landing/auto-step route: `/:moduleCode`
- explicit step route: `/:moduleCode/:stepName`

A custom route matcher validates whether a step is valid for the selected module journey type.
If a module is valid but no step is provided, users are redirected to the first step automatically.
Invalid module requests are handled with a not-found experience.

### 3. Customer Journeys

Two journey types are implemented:

- motor journey: your-details -> your-vehicle -> additional-drivers -> your-policy -> your-quotes
- property journey: your-details -> your-property -> joint-proposer -> your-policy -> assumptions -> your-quotes

Each module maps to one of these journey types via configuration, then renders the relevant step components.

### 4. Dynamic Form Engine

The form system is schema-driven using reusable field definitions.
Supported capabilities include:

- input types such as text, email, tel, number, date, select, radio, and checkbox
- per-field validation (required, min/max, length, email, custom validators)
- conditional visibility and enablement rules
- normalization pipelines (trim, uppercase, lowercase, phone/date/currency formatting)
- central validation message resolution

This approach keeps step components focused on workflow while form behavior stays reusable and consistent.

### 5. Step Navigation and State Management

Journey data is stored per module/step key and merged into a final payload for quote output.
Navigation is coordinated through a step-navigation service that triggers submit-on-next behavior from the page-level controls.

This gives:

- consistent next/previous step UX
- step-level persistence while moving through the journey
- clean separation between UI navigation and form submission logic

### 6. Address Lookup + Manual Entry

The first journey step includes address capture using:

- postcode + house number/name lookup
- mapped API response into form-friendly fields
- manual address entry fallback path

Validation ensures users resolve address details before moving forward.

### 7. Demo Quotes and Payload Visibility

At the final step, the app renders demo quote cards and a pretty-printed payload snapshot.
This is useful for validating:

- journey-to-payload mapping
- quote-page UX
- integration contract shape for future backend pricing services

## Technical Approach

### Angular Patterns

The app uses modern Angular standalone architecture with:

- standalone components
- signals and computed state for reactive UI
- native template control flow (`@if`, `@for`, `@switch`)
- dependency injection via `inject()`

### Config-First Design

Brand, module, journey, and form behavior are primarily config-driven.
This reduces hardcoded branching and makes it easier to:

- onboard new brands/modules
- evolve journey steps
- reuse shared form and workflow infrastructure

### Separation of Responsibilities

The codebase is split into:

- `core`: models, config, services, validators
- `features`: journey pages and module-specific flow components
- `shared`: reusable UI components (header, footer, dynamic-form, not-found)

This keeps domain logic centralized while feature flows remain composable.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm (project is configured with npm)

### Install

```bash
npm install
```

### Run Locally

```bash
npm start
```

Then open `http://localhost:4200`.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Next Logical Milestones

- integrate live quote/pricing APIs in place of demo quotes
- persist journey state beyond in-memory session (for resume/revisit)
- add deeper automated test coverage for journeys and validation rules
- expand module-specific question sets and underwriting logic
