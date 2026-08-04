import {
  Component,
  Injector,
  type OnInit,
  type WritableSignal,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { type Field, FormField, form } from '@angular/forms/signals';
import {
  buildSectionModel,
  buildSectionSchema,
  type SectionModel,
} from '../../../core/forms/signal-forms-schema';
import type { FormFieldConfig } from '../../../core/models/form-field.model';

/** Error shape the schema produces, narrowed for template use. */
interface FieldError {
  readonly kind: string;
  readonly message?: string;
}

interface FieldView {
  value: () => unknown;
  errors: () => readonly FieldError[];
  hidden: () => boolean;
  disabled: () => boolean;
  touched: () => boolean;
  markAsTouched: () => void;
  valid: () => boolean;
}

/**
 * Renders a section's fields with Angular Signal Forms.
 *
 * Replacement for `DynamicFormComponent`, consuming the same `FormFieldConfig`, so
 * journey configuration is untouched. Differences that matter:
 *
 * - conditional visibility and enablement come from the schema and re-evaluate
 *   themselves; there is no manual sync pass
 * - hidden and disabled fields drop out of the parent's validity by definition, so
 *   an irrelevant question can no longer block a step
 * - the model is a signal the form writes into, so seeding a value does not tear
 *   down and rebuild controls the way the reactive renderer did
 */
interface FormInstance {
  readonly model: WritableSignal<SectionModel>;
  readonly tree: unknown;
}

@Component({
  selector: 'app-signal-form',
  imports: [FormField],
  templateUrl: './signal-form.html',
})
export class SignalFormComponent implements OnInit {
  readonly fields = input.required<readonly FormFieldConfig[]>();
  readonly initialValue = input<Record<string, unknown>>({});

  readonly valueChanged = output<Record<string, unknown>>();

  private readonly injector = inject(Injector);

  /** Reveals errors for untouched fields once the customer has tried to continue. */
  private readonly submitAttempted = signal(false);

  private readonly instance = signal<FormInstance | null>(null);

  /**
   * Builds the model and field tree once, from the inputs.
   *
   * Deliberately in `ngOnInit` rather than a `computed`: `form()` registers an
   * internal effect, and effects cannot be created inside a reactive context. The
   * field list is static configuration for the lifetime of a rendered section, and
   * the section outlet recreates this component when the step or section changes, so
   * there is nothing to recompute.
   */
  ngOnInit(): void {
    const fields = this.fields();
    const model = signal<SectionModel>(buildSectionModel(fields, this.initialValue()));
    const tree = form(model, buildSectionSchema(fields), { injector: this.injector });

    this.instance.set({ model, tree });
  }

  constructor() {
    effect(() => {
      const instance = this.instance();
      if (instance) {
        this.valueChanged.emit({ ...instance.model() });
      }
    });
  }

  /**
   * The field tree node for a field.
   *
   * `[formField]` is type-checked against the value type its host element accepts,
   * and the model here is dynamic by design, so the three accessors below assert the
   * shape each host requires. The assertions are contained in this component; the
   * schema adapter guarantees the underlying value actually matches the field type.
   */
  private treeFor(field: FormFieldConfig): Field<unknown> {
    const tree = this.instance()?.tree as Record<string, Field<unknown>> | undefined;
    return tree?.[field.name] as Field<unknown>;
  }

  /** For `<select>`, `<textarea>` and radio inputs, which read and write strings. */
  stringField(field: FormFieldConfig): Field<string> {
    return this.treeFor(field) as Field<string>;
  }

  /** For checkbox and toggle inputs, which bind to `checked`. */
  booleanField(field: FormFieldConfig): Field<boolean> {
    return this.treeFor(field) as Field<boolean>;
  }

  /** For text-like inputs, whose value may be a string, number or null. */
  inputField(field: FormFieldConfig): Field<string | number | boolean | Date | null> {
    return this.treeFor(field) as Field<string | number | boolean | Date | null>;
  }

  /**
   * Radio option values reach the DOM as strings, and the native binding reads
   * `element.value` back, so the model receives a string. Every current option value
   * is already a string; this makes the coercion explicit rather than implicit.
   */
  optionValue(value: string | number | boolean): string {
    return `${value}`;
  }

  private stateFor(field: FormFieldConfig): FieldView | null {
    const node = this.treeFor(field) as unknown as (() => FieldView) | undefined;
    return node ? node() : null;
  }

  isVisible(field: FormFieldConfig): boolean {
    return !(this.stateFor(field)?.hidden() ?? false);
  }

  isDisabled(field: FormFieldConfig): boolean {
    return this.stateFor(field)?.disabled() ?? false;
  }

  /** Errors are only surfaced once the field was touched or continue was pressed. */
  messagesFor(field: FormFieldConfig): readonly string[] {
    const state = this.stateFor(field);
    if (!state || (!state.touched() && !this.submitAttempted())) {
      return [];
    }

    return state.errors().map(error => error.message ?? this.defaultMessage(field, error.kind));
  }

  /**
   * Wording for errors the configuration did not supply a message for.
   *
   * Mirrors `FormValidationMessageService`, which the reactive renderer uses, so a
   * field reads the same either side of the migration. Constraint values come from
   * the field's own configuration rather than the error payload.
   */
  private defaultMessage(field: FormFieldConfig, kind: string): string {
    const rule = (field.validators ?? []).find(
      validator => validator.type === kind || (validator.type === 'custom' && validator.name === kind),
    );
    const limit = rule?.value;

    switch (kind) {
      case 'required':
        return `${field.label} is required.`;
      case 'email':
        return 'Enter a valid email address.';
      case 'minLength':
        return `${field.label} must be at least ${limit} characters.`;
      case 'maxLength':
        return `${field.label} must be ${limit} characters or fewer.`;
      case 'min':
        return `${field.label} must be greater than or equal to ${limit}.`;
      case 'max':
        return `${field.label} must be less than or equal to ${limit}.`;
      case 'pattern':
        return `${field.label} is not in the expected format.`;
      default:
        return `${field.label} is invalid.`;
    }
  }

  isInvalid(field: FormFieldConfig): boolean {
    return this.messagesFor(field).length > 0;
  }

  isValid(field: FormFieldConfig): boolean {
    const state = this.stateFor(field);
    if (!state || (!state.touched() && !this.submitAttempted())) {
      return false;
    }

    return state.errors().length === 0;
  }

  valueOf(field: FormFieldConfig): unknown {
    return this.stateFor(field)?.value();
  }

  isChecked(field: FormFieldConfig): boolean {
    return this.valueOf(field) === true;
  }

  messageId(field: FormFieldConfig): string {
    return `${field.name}-messages`;
  }

  labelId(field: FormFieldConfig): string {
    return `${field.name}-label`;
  }

  helpId(field: FormFieldConfig): string {
    return `${field.name}-help`;
  }

  private readonly expandedHelp = signal<Record<string, boolean>>({});

  isHelpExpanded(field: FormFieldConfig): boolean {
    return this.expandedHelp()[field.name] ?? false;
  }

  toggleHelp(field: FormFieldConfig): void {
    this.expandedHelp.update(current => ({
      ...current,
      [field.name]: !this.isHelpExpanded(field),
    }));
  }

  radioLayout(field: FormFieldConfig): 'row' | 'column' {
    return field.metadata?.radioLayout === 'row' ? 'row' : 'column';
  }

  radioGridTemplate(field: FormFieldConfig): string | null {
    if (this.radioLayout(field) !== 'row') {
      return null;
    }

    const optionCount = field.options?.length ?? 0;
    return optionCount > 0 ? `repeat(${optionCount}, minmax(0, 1fr))` : null;
  }

  shouldStackRadioOnSmall(field: FormFieldConfig): boolean {
    return this.radioLayout(field) === 'row' && (field.options?.length ?? 0) > 2;
  }

  /**
   * Section contract: reveal any outstanding errors and report what was captured.
   *
   * Hidden and disabled fields are excluded from `valid()` by Signal Forms, so a
   * question the customer never saw cannot block the step.
   */
  collect(): { valid: boolean; values: Record<string, unknown> } {
    const instance = this.instance();
    if (!instance) {
      return { valid: true, values: {} };
    }

    const root = (instance.tree as () => FieldView)();

    this.submitAttempted.set(true);
    root.markAsTouched();

    return { valid: root.valid(), values: { ...instance.model() } };
  }
}
