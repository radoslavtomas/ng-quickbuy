import { Component, computed, inject } from '@angular/core';
import { BrandService } from '../../../../core/services/brand.service';
import { MODULE_CONTENT_STYLES } from '../config/shared/common';
import { MotorQuoteJourneyComponent, PropertyQuoteJourneyComponent } from './quote-journeys.component';

class BaseModuleComponent {
  protected readonly brandService = inject(BrandService);
  protected readonly brand = this.brandService.config;

  protected readonly module = computed(() => {
    const code = this.brandService.currentModuleCode();
    return code ? this.brandService.getModuleByCode(code) : null;
  });
}

@Component({
  selector: 'app-pc-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Car Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'PC' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'PC'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class PcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-gv-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Van Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'GV' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'GV'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class GvModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-bd-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Breakdown Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'BD' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'BD'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class BdModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-tx-module',
  imports: [MotorQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Taxi Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'TX' }}</p>
      <app-motor-quote-journey [moduleCode]="module()?.code ?? 'TX'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class TxModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hc-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'House Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'HC' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'HC'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hh-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Holiday Home Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'HH' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'HH'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HhModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-ll-module',
  imports: [PropertyQuoteJourneyComponent],
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>{{ module()?.description ?? 'Landlord Insurance' }}</h1>
      <p>Build your quote with {{ brand.fullName }} one step at a time.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'LL' }}</p>
      <app-property-quote-journey [moduleCode]="module()?.code ?? 'LL'" />
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class LlModuleComponent extends BaseModuleComponent {}
