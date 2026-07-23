import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { ModulePageComponent } from './features/modules/module-page';
import { NotFoundComponent } from './shared/components/not-found/not-found';

/**
 * Module routes use the module code as the first path segment, e.g. /HC, /GV.
 * Add feature-level routes inside each module entry as the app grows.
 */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: ':moduleCode', component: ModulePageComponent },
  { path: '**', component: NotFoundComponent },
];
