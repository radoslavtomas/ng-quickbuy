import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandService } from '../../core/services/brand.service';
import {
  BdModuleComponent,
  GvModuleComponent,
  HcModuleComponent,
  HhModuleComponent,
  LlModuleComponent,
  PcModuleComponent,
  TxModuleComponent,
} from './specific-modules';

@Component({
  selector: 'app-module-page',
  imports: [
    RouterLink,
    PcModuleComponent,
    GvModuleComponent,
    BdModuleComponent,
    TxModuleComponent,
    HcModuleComponent,
    HhModuleComponent,
    LlModuleComponent,
  ],
  templateUrl: './module-page.html',
  styleUrl: './module-page.css',
})
export class ModulePageComponent {
  private readonly brandService = inject(BrandService);

  readonly brand = this.brandService.config;
  readonly currentModuleCode = this.brandService.currentModuleCode;

  readonly currentModule = computed(() => {
    const code = this.currentModuleCode();
    return code ? this.brandService.getModuleByCode(code) : null;
  });
}
