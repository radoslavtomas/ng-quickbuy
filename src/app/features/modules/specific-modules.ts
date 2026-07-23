import { Component, computed, inject } from '@angular/core';
import { BrandService } from '../../core/services/brand.service';

const MODULE_CONTENT_STYLES = `
  .module-page {
    border-top: 4px solid var(--brand-primary);
    border-radius: 0.75rem;
    background: white;
    padding: 1.25rem;
  }

  .module-page h1 {
    font-size: clamp(1.25rem, 3.5vw, 1.75rem);
    font-weight: 700;
    color: #0f172a;
  }

  .module-page p {
    margin-top: 0.5rem;
    color: #334155;
    line-height: 1.6;
  }

  .module-page .module-code {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-secondary);
  }
`;

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
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Car Insurance</h1>
      <p>Build a tailored private car quote with {{ brand.fullName }}.</p>
      <p class="module-code">Code: {{ module()?.code ?? 'PC' }}</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class PcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-gv-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Van Insurance</h1>
      <p>Start a van cover quote and compare options in minutes.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class GvModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-bd-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Breakdown Insurance</h1>
      <p>Set up roadside and recovery protection for your journeys.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class BdModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-tx-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Taxi Insurance</h1>
      <p>Get cover designed for private hire and public hire drivers.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class TxModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hc-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>House Insurance</h1>
      <p>Protect your home and belongings with flexible cover levels.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HcModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-hh-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Holiday Home Insurance</h1>
      <p>Arrange specialist protection for your holiday property.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class HhModuleComponent extends BaseModuleComponent {}

@Component({
  selector: 'app-ll-module',
  template: `
    <section class="module-page" [style.--brand-primary]="brand.primaryColor" [style.--brand-secondary]="brand.secondaryColor">
      <h1>Landlord Insurance</h1>
      <p>Cover rental properties against key risks and liabilities.</p>
    </section>
  `,
  styles: [MODULE_CONTENT_STYLES],
})
export class LlModuleComponent extends BaseModuleComponent {}
