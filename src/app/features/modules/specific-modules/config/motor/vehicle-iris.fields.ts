import type { FormFieldConfig } from '../../../../../core/models/form-field.model';
import { resolveIrisModule } from './vehicle-field-map';

/**
 * Make -> model -> year -> edition, each revealed once the previous one is
 * answered and each reloading (and clearing itself) when an earlier one changes.
 * `context` is shared by reference across all four fields on purpose: it is fixed
 * for the lifetime of this field list, so passing the same object avoids ever
 * looking like a changed input to change detection.
 */
export function createVehicleIrisFields(moduleCode: string): readonly FormFieldConfig[] {
  const context = { irisModule: resolveIrisModule(moduleCode) };

  return [
    {
      type: 'dynamic-select',
      label: 'Make',
      name: 'make',
      validators: [{ type: 'required', message: 'Make is required.' }],
      metadata: {
        placeholder: 'Select a make',
        dynamicSelectConfig: { endpoint: 'iris-make', context },
      },
    },
    {
      type: 'dynamic-select',
      label: 'Model',
      name: 'model',
      validators: [{ type: 'required', message: 'Model is required.' }],
      visibleWhen: [{ field: 'make', operator: 'truthy' }],
      metadata: {
        placeholder: 'Select a model',
        dynamicSelectConfig: { endpoint: 'iris-model', dependsOn: ['make'], context },
      },
    },
    {
      type: 'dynamic-select',
      label: 'Year',
      name: 'year',
      validators: [{ type: 'required', message: 'Year is required.' }],
      visibleWhen: [{ field: 'model', operator: 'truthy' }],
      metadata: {
        placeholder: 'Select a year',
        dynamicSelectConfig: { endpoint: 'iris-year', dependsOn: ['make', 'model'], context },
      },
    },
    {
      type: 'dynamic-select',
      label: 'Edition',
      name: 'edition',
      validators: [{ type: 'required', message: 'Edition is required.' }],
      visibleWhen: [{ field: 'year', operator: 'truthy' }],
      metadata: {
        placeholder: 'Select an edition',
        dynamicSelectConfig: {
          endpoint: 'iris-edition',
          dependsOn: ['make', 'model', 'year'],
          context,
        },
      },
    },
  ];
}
