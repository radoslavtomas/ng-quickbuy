import { Component, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../../core/services/brand.service';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  private readonly brandService = inject(BrandService);

  readonly brand = this.brandService.config;
  readonly currentYear = new Date().getFullYear();

  readonly isQld = computed(() => this.brand.id === 'qld');

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
