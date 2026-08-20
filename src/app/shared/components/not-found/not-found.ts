import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  private readonly brandService = inject(BrandService);

  protected readonly brand = this.brandService.config;

  /** The 404 badge and the home button are white on these, so they must carry it. */
  protected readonly accent = this.brandService.accent;
  protected readonly accentAlt = this.brandService.accentAlt;
}
