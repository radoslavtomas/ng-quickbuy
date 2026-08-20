import { Component, computed, effect, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../core/services/brand.service';
import { ModuleContextService } from '../../../core/services/module-context.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly brandService = inject(BrandService);
  private readonly moduleContext = inject(ModuleContextService);

  readonly brand = this.brandService.config;

  /** Safe to paint white on, and to read as text on the white top bar. */
  readonly accent = this.brandService.accent;

  readonly currentModuleCode = this.brandService.currentModuleCode;

  /**
   * Module parameters come from the shared context service rather than a second
   * request of the header's own, so the header and the journey agree on one
   * response and the call is made once per module.
   */
  private readonly moduleParams = computed(() => {
    const code = this.currentModuleCode();
    return code ? this.moduleContext.parameters(code) : null;
  });

  readonly headerTitle = computed(
    () => this.moduleParams()?.parameters.description ?? this.brand.fullName,
  );

  readonly headerPhone = computed(
    () => this.moduleParams()?.parameters.phone ?? this.brand.mainPhone,
  );

  readonly headerIcon = computed(() => this.moduleParams()?.parameters.icon ?? null);

  readonly headerPhoneLink = computed(() => 'tel:' + this.headerPhone().replace(/\s+/g, ''));

  constructor() {
    // On a deep link the header can be the first thing to know a module is active,
    // so it asks too. The context service de-duplicates concurrent callers.
    effect(() => {
      const code = this.currentModuleCode();
      if (code) {
        void this.moduleContext.ensureLoaded(code);
      }
    });
  }
}
