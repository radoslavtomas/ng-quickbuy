import { Component, computed, inject } from '@angular/core';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap } from 'rxjs';
import { BrandService } from '../../../core/services/brand.service';
import { ModuleParametersService } from '../../../core/services/module-parameters.service';
import type { ModuleParametersResponse } from '../../../core/models/module-parameters.model';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly brandService = inject(BrandService);
  private readonly moduleParamsService = inject(ModuleParametersService);

  private readonly document = inject(DOCUMENT);
  private readonly domain = this.document.defaultView?.location.hostname ?? '';

  readonly brand = this.brandService.config;
  readonly currentModuleCode = this.brandService.currentModuleCode;

  readonly moduleParams = toSignal<ModuleParametersResponse | null>(
    toObservable(this.currentModuleCode).pipe(
      switchMap((code: string | null) =>
        code
          ? this.moduleParamsService.fetchParameters(this.brand.id, code, this.domain)
          : of(null),
      ),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  readonly headerTitle = computed(() =>
    this.moduleParams()?.parameters.description ?? this.brand.fullName,
  );

  readonly headerPhone = computed(() =>
    this.moduleParams()?.parameters.phone ?? this.brand.mainPhone,
  );

  readonly headerIcon = computed(() =>
    this.moduleParams()?.parameters.icon ?? null,
  );

  readonly headerPhoneLink = computed(() =>
    'tel:' + this.headerPhone().replace(/\s+/g, ''),
  );
}
