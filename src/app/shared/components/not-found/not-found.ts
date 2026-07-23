import { Component, inject } from '@angular/core';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  protected readonly brand = inject(BrandService).config;
}