import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { findModuleByCode } from './core/config/module-catalogue';

const loadHomeComponent = () => import('./features/home/home').then(m => m.HomeComponent);
const loadJourneyPageComponent = () =>
  import('./features/modules/journey-page/journey-page').then(m => m.JourneyPageComponent);
const loadNotFoundComponent = () =>
  import('./shared/components/not-found/not-found').then(m => m.NotFoundComponent);

/**
 * Matches `/:moduleCode/:stepName` for any module in the catalogue.
 *
 * Deliberately checks the module code only, not the step. The catalogue is a small
 * lookup, whereas validating the step would mean importing every journey definition
 * — and therefore every field schema — into the initial bundle, which grows with
 * each product added. The journey page validates the step instead and shows the
 * not-found view in place for one it does not recognise.
 */
function moduleStepMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length !== 2 || !findModuleByCode(segments[0].path)) {
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
 */
export const routes: Routes = [
  { path: '', loadComponent: loadHomeComponent },
  { matcher: moduleStepMatcher, loadComponent: loadJourneyPageComponent },
  { path: ':moduleCode', loadComponent: loadJourneyPageComponent },
  { path: '**', loadComponent: loadNotFoundComponent },
];
