import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../core/services/brand.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly brandService = inject(BrandService);

  readonly brand = this.brandService.config;
}
