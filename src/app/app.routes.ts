import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { HomeComponent } from './features/home/home';
import { ModulePageComponent } from './features/modules/module-page';
import { NotFoundComponent } from './shared/components/not-found/not-found';
import { isValidJourneyStepForModule } from './core/config/module-journeys.config';

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
  { path: '', component: HomeComponent },
  { matcher: moduleStepMatcher, component: ModulePageComponent },
  { path: ':moduleCode', component: ModulePageComponent },
  { path: '**', component: NotFoundComponent },
];
