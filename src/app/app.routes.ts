import { Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found';

/**
 * Module routes use the module code as the first path segment, e.g. /HC, /GV.
 * Add feature-level routes inside each module entry as the app grows.
 */
export const routes: Routes = [
  { path: ':moduleCode', children: [] },
  { path: '', children: [] },
  { path: '**', component: NotFoundComponent },
];
