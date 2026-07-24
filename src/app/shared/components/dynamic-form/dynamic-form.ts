import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormFieldConfig, FieldCondition } from '../../../core/models/form-field.model';
import { FormNormalizationService } from '../../../core/services/form-normalization.service';
import { FormValidationRegistryService } from '../../../core/services/form-validation-registry.service';
import { FormValidationMessageService } from '../../../core/services/form-validation-message.service';

@Component({
  selector: 'app-dynamic-form',
  imports: [ReactiveFormsModule],
  templateUrl: './dynamic-form.html',
  styleUrl: './dynamic-form.css',
})
export class DynamicFormComponent {
  readonly fields = input.required<readonly FormFieldConfig[]>();
  readonly initialValue = input<Record<string, unknown>>({});
  readonly submitLabel = input('Continue');

  readonly submitted = output<Record<string, unknown>>();
  readonly invalidSubmit = output<void>();

  readonly form = new FormGroup({});
  readonly hasSubmitted = signal(false);
  readonly expandedHelp = signal<Record<string, boolean>>({});

  private readonly destroyRef = inject(DestroyRef);
  private readonly normalizationService = inject(FormNormalizationService);
  private readonly validationRegistry = inject(FormValidationRegistryService);
  private readonly validationMessageService = inject(FormValidationMessageService);

  constructor() {
    effect(() => {
      const schema = this.fields();
      const values = this.initialValue();
      this.buildForm(schema, values);
      this.syncConditionalState();
      this.revalidateCrossFieldRules();
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.syncConditionalState();
      this.revalidateCrossFieldRules();
    });
  }

  controlFor(fieldName: string): AbstractControl | null {
    return this.form.get(fieldName);
  }

  isVisible(field: FormFieldConfig): boolean {
    return this.evaluateConditions(field.visibleWhen);
  }

  isInvalid(field: FormFieldConfig): boolean {
    const control = this.controlFor(field.name);
    if (!control) {
      return false;
    }

    const requiredMissing = this.hasRequiredRule(field) && this.isRequiredMissing(field, control.value);

    return (control.invalid || requiredMissing) && (control.touched || control.dirty || this.hasSubmitted());
  }

  isValid(field: FormFieldConfig): boolean {
    const control = this.controlFor(field.name);
    if (!control) {
      return false;
    }

    const wasInteractedWith = control.touched || control.dirty || this.hasSubmitted();
    return !control.pending && control.valid && wasInteractedWith;
  }

  messageId(field: FormFieldConfig): string {
    return `${field.name}-messages`;
  }

  helpId(field: FormFieldConfig): string {
    return `${field.name}-help`;
  }

  isHelpExpanded(field: FormFieldConfig): boolean {
    return this.expandedHelp()[field.name] ?? false;
  }

  toggleHelp(field: FormFieldConfig): void {
    this.expandedHelp.update((current) => ({
      ...current,
      [field.name]: !this.isHelpExpanded(field),
    }));
  }

  currentLength(field: FormFieldConfig): number {
    const value = this.controlFor(field.name)?.value;
    return typeof value === 'string' ? value.length : 0;
  }

  normalize(field: FormFieldConfig): void {
    const control = this.controlFor(field.name);
    if (!control) {
      return;
    }

    const normalizedValue = this.normalizationService.normalizeFieldValue(field, control.value);
    if (normalizedValue !== control.value) {
      control.setValue(normalizedValue);
    }
  }

  fieldMessages(field: FormFieldConfig): string[] {
    const control = this.controlFor(field.name);
    if (!control || !(control.touched || control.dirty || this.hasSubmitted())) {
      return [];
    }

    const resolved = this.validationMessageService.resolveMessages(field, control.errors);
    if (resolved.length) {
      return resolved;
    }

    if (this.hasRequiredRule(field) && this.isRequiredMissing(field, control.value)) {
      return [this.requiredMessage(field)];
    }

    return [];
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
    if (this.radioLayout(field) !== 'row') {
      return false;
    }

    return (field.options?.length ?? 0) > 2;
  }

  isChecked(field: FormFieldConfig): boolean {
    return this.controlFor(field.name)?.value === true;
  }

  onSubmit(): void {
    this.hasSubmitted.set(true);
    this.fields().forEach((field) => this.normalize(field));
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.invalidSubmit.emit();
      return;
    }

    this.submitted.emit(this.form.getRawValue());
  }

  private buildForm(fields: readonly FormFieldConfig[], initialValues: Record<string, unknown>): void {
    this.hasSubmitted.set(false);
    this.expandedHelp.set({});

    Object.keys(this.form.controls).forEach((controlName) => {
      this.form.removeControl(controlName);
    });

    for (const field of fields) {
      const initialValue = this.resolveInitialValue(field, initialValues[field.name]);
      const validators = this.validationRegistry.createValidators(field.validators);
      if ((field.type === 'checkbox' || field.type === 'toggle') && this.hasRequiredRule(field)) {
        validators.push(Validators.requiredTrue);
      }

      this.form.addControl(
        field.name,
        new FormControl({ value: initialValue, disabled: false }, { validators }),
      );
    }
  }

  private resolveInitialValue(field: FormFieldConfig, value: unknown): unknown {
    if (value !== undefined) {
      return value;
    }

    if (field.type === 'checkbox' || field.type === 'toggle') {
      return false;
    }

    return '';
  }

  private syncConditionalState(): void {
    for (const field of this.fields()) {
      const control = this.controlFor(field.name);
      if (!control) {
        continue;
      }

      const shouldEnable = this.evaluateConditions(field.enabledWhen);
      if (shouldEnable && control.disabled) {
        control.enable({ emitEvent: false });
      }

      if (!shouldEnable && control.enabled) {
        control.disable({ emitEvent: false });
      }
    }
  }

  private revalidateCrossFieldRules(): void {
    const controls = Object.values(this.form.controls) as AbstractControl[];
    controls.forEach((control) => {
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  private evaluateConditions(conditions: readonly FieldCondition[] | undefined): boolean {
    if (!conditions?.length) {
      return true;
    }

    return conditions.every((condition) => {
      const value = this.controlFor(condition.field)?.value;

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'notEquals':
          return value !== condition.value;
        case 'in':
          return Array.isArray(condition.value) ? condition.value.includes(value) : false;
        case 'notIn':
          return Array.isArray(condition.value) ? !condition.value.includes(value) : true;
        case 'truthy':
          return Boolean(value);
        case 'falsy':
          return !value;
        default:
          return true;
      }
    });
  }

  private hasRequiredRule(field: FormFieldConfig): boolean {
    return (field.validators ?? []).some((validator) => validator.type === 'required');
  }

  private requiredMessage(field: FormFieldConfig): string {
    const requiredRule = (field.validators ?? []).find((validator) => validator.type === 'required');
    return requiredRule?.message ?? `${field.label} is required.`;
  }

  private isEmptyValue(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  private isRequiredMissing(field: FormFieldConfig, value: unknown): boolean {
    if (field.type === 'checkbox' || field.type === 'toggle') {
      return value !== true;
    }

    return this.isEmptyValue(value);
  }
}
