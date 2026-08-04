<!-- Single source of truth for agent instructions.
     .claude/CLAUDE.md, .github/copilot-instructions.md and .junie/guidelines.md are
     symlinks to this file - edit this file only. -->

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## This Project's Architecture

NG QuickBuy renders multi-step insurance quote journeys for several brands. Journey structure is
data, not components. Read `README.md` for the full picture; these are the rules that matter when
changing code:

- There is ONE journey screen (`features/modules/journey-page/`). Do NOT add per-module, per-step or
  per-brand components. A new step is a new entry in a `*.journey.ts` definition; a new question is a
  new entry in a `steps/*.fields.ts` array.
- `core/config/module-catalogue.ts` is the ONLY place mapping a module code to a journey. Brands list
  module codes and nothing else about the product.
- Step order comes from position in the `steps` array. Never add `next`/`prev` links or a parallel
  ordering list.
- A step is composed of sections. Use a `fields` section for anything the generic renderer can draw;
  add a `custom` section plus a `@case` in `section-outlet.component.ts` only for genuinely bespoke
  UI. Custom sections expose `collect(): { valid, values }`.
- Answers live in `JourneyStateService`, keyed by module, step and section. Never merge answers into
  one flat object: field names are only unique within a section.
- Never silently default an unrecognised module code or step to a real one. Selling the wrong
  product's questions is worse than showing an error.
- Do NOT render inputs that are not wired to a field config. An input that discards what the customer
  typed is worse than no input.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection
