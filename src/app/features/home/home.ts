import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../core/services/brand.service';
import { JourneySessionService } from '../../core/services/journey-session.service';
import { JourneyStateService } from '../../core/services/journey-state.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly brandService = inject(BrandService);
  private readonly journeySession = inject(JourneySessionService);
  private readonly journeyState = inject(JourneyStateService);

  readonly brand = this.brandService.config;
  readonly modules = this.brandService.modules;

  constructor() {
    this.journeySession.clearAll();
    this.journeyState.resetAll();
  }
}
