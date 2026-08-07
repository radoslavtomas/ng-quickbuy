import {
  Component,
  type OnDestroy,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { type Observable, Subject, Subscription, catchError, debounceTime, of, switchMap } from 'rxjs';

export interface AutocompleteOption {
  readonly code: string;
  readonly description: string;
}

@Component({
  selector: 'app-autocomplete-input',
  templateUrl: './autocomplete-input.html',
})
export class AutocompleteInputComponent implements OnDestroy {
  readonly label = input.required<string>();
  readonly name = input.required<string>();
  readonly searchFn = input.required<(keyword: string) => Observable<AutocompleteOption[]>>();
  readonly initialCode = input('');
  readonly initialDescription = input('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly valid = input(false);

  readonly selected = output<AutocompleteOption>();
  readonly cleared = output<void>();

  readonly inputValue = signal('');
  readonly options = signal<readonly AutocompleteOption[]>([]);
  readonly isOpen = signal(false);
  readonly activeIndex = signal(-1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedOption = signal<AutocompleteOption | null>(null);

  private readonly search$ = new Subject<string>();
  private searchSub: Subscription | null = null;

  readonly listboxId = computed(() => `${this.name()}-listbox`);
  readonly activeDescendantId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? `${this.name()}-option-${index}` : null;
  });

  constructor() {
    effect(() => {
      const desc = this.initialDescription();
      if (desc) {
        this.inputValue.set(desc);
        this.selectedOption.set({ code: this.initialCode(), description: desc });
      }
    });

    this.searchSub = this.search$
      .pipe(
        debounceTime(300),
        switchMap(keyword => {
          if (keyword.length < 4) {
            return of([]);
          }

          this.loading.set(true);
          this.error.set(null);
          return this.searchFn()(keyword).pipe(
            catchError(() => {
              this.error.set('Search unavailable, please try again');
              return of([]);
            }),
          );
        }),
      )
      .subscribe(results => {
        this.loading.set(false);
        const limited = results.slice(0, 5);
        this.options.set(limited);
        this.isOpen.set(limited.length > 0);
        this.activeIndex.set(limited.length > 0 ? 0 : -1);
      });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.selectedOption.set(null);
    this.error.set(null);
    this.cleared.emit();
    this.search$.next(value.trim());
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen() && opts.length > 0) {
          this.isOpen.set(true);
        }
        this.activeIndex.update(i => Math.min(i + 1, opts.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.update(i => Math.max(i - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        if (this.isOpen() && this.activeIndex() >= 0) {
          this.selectOption(opts[this.activeIndex()]);
        }
        break;

      case 'Escape':
        this.isOpen.set(false);
        this.activeIndex.set(-1);
        break;
    }
  }

  onBlur(): void {
    // Delay so click on option can fire before closing
    setTimeout(() => {
      if (this.isOpen() && this.options().length > 0 && !this.selectedOption()) {
        this.selectOption(this.options()[0]);
      }
      this.isOpen.set(false);
    }, 150);
  }

  selectOption(option: AutocompleteOption): void {
    this.selectedOption.set(option);
    this.inputValue.set(option.description);
    this.isOpen.set(false);
    this.activeIndex.set(-1);
    this.error.set(null);
    this.selected.emit(option);
  }

  optionId(index: number): string {
    return `${this.name()}-option-${index}`;
  }
}
