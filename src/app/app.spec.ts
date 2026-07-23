import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the default app shell for the home route', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
    expect(compiled.querySelector('app-not-found')).toBeNull();
  });

  it('should render the not found page for an unsupported module', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/ZZ');

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
    expect(compiled.querySelector('app-footer')).not.toBeNull();
    expect(compiled.querySelector('app-not-found')).not.toBeNull();
    expect(compiled.textContent).toContain('404');
  });

  it('should render the not found page for an unmatched module child route', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/TX/asdfg');

    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
    expect(compiled.querySelector('app-footer')).not.toBeNull();
    expect(compiled.querySelector('app-not-found')).not.toBeNull();
    expect(compiled.textContent).toContain('Page not found');
  });
});
