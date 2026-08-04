import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { isValidJourneyStepForModule } from './core/config/module-journeys.config';

const loadHomeComponent = () => import('./features/home/home').then(m => m.HomeComponent);
const loadModulePageComponent = () =>
  import('./features/modules/module-page').then(m => m.ModulePageComponent);
const loadNotFoundComponent = () =>
  import('./shared/components/not-found/not-found').then(m => m.NotFoundComponent);

function moduleStepMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 2) {
    return null;
  }

  const moduleCode = segments[0].path.toUpperCase();
  const stepName = segments[1].path.toLowerCase();

  if (!isValidJourneyStepForModule(moduleCode, stepName)) {
    return null;
  }

  return {
    consumed: segments,
    posParams: {
      moduleCode: segments[0],
      stepName: segments[1],
    },
  };
}

/**
 * Module routes use the module code as the first path segment, e.g. /HC, /GV.
 * Add feature-level routes inside each module entry as the app grows.
 */
export const routes: Routes = [
  { path: '', loadComponent: loadHomeComponent },
  { matcher: moduleStepMatcher, loadComponent: loadModulePageComponent },
  { path: ':moduleCode', loadComponent: loadModulePageComponent },
  { path: '**', loadComponent: loadNotFoundComponent },
];
