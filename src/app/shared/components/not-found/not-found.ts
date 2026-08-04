import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFoundComponent {
  protected readonly brand = inject(BrandService).config;
}