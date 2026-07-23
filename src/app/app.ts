import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { NotFoundComponent } from './shared/components/not-found/not-found';
import { BrandService } from './core/services/brand.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, NotFoundComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly brandService = inject(BrandService);

  protected readonly hasInvalidModuleRequest = this.brandService.hasInvalidModuleRequest;
}
