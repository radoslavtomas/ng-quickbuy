import {
  Component,
  DestroyRef,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { FormValueControl } from '@angular/forms/signals';
import { Subject, catchError, debounceTime, defer, map, of, switchMap } from 'rxjs';
import type { AutocompleteOption } from '../../../../core/models/autocomplete-option.model';
import type { AutocompleteSource } from '../../../../core/services/autocomplete-source.service';

/** Shortest keyword the search backends accept. */
export const MIN_KEYWORD_LENGTH = 3;

/** Quiet period before a keystroke becomes a request. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Most matches shown at once; more than this is not a list a customer reads. */
export const MAX_VISIBLE_OPTIONS = 5;

const SEARCH_FAILED_MESSAGE = 'Search unavailable, please try again.';

/**
 * A search-driven combobox that resolves free text to a coded option.
 *
 * Implements `FormValueControl`, so `[formField]` two-way binds the whole
 * `AutocompleteOption` and takes care of disabled state and touched-on-blur. The
 * answer is the option, not the text: a customer who types something the backend
 * does not recognise has not answered, and the field stays empty so `required`
 * catches it.
 *
 * Nothing is ever chosen on the customer's behalf. An earlier version selected the
 * first match on blur, which could silently record an occupation the customer never
 * saw, and the wrong occupation is worse for them than an unanswered question.
 */
@Component({
  selector: 'app-autocomplete-input',
  templateUrl: './autocomplete-input.html',
})
export class AutocompleteInputComponent implements FormValueControl<AutocompleteOption | null> {
  /** Bound by `[formField]`; the resolved option, or `null` while unresolved. */
  readonly value = model<AutocompleteOption | null>(null);

  /** Bound by `[formField]` from the field's disabled state. */
  readonly disabled = input(false);

  readonly source = input.required<AutocompleteSource>();
  readonly controlId = input.required<string>();
  /** Ids of anything else describing this control, such as the message list. */
  readonly describedBy = input<string | null>(null);
  readonly showInvalid = input(false);
  readonly showValid = input(false);

  /** Read by `[formField]` to mark the field touched when focus leaves. */
  readonly touch = output<void>();

  private readonly inputElement = viewChild<ElementRef<HTMLInputElement>>('control');
  private readonly destroyRef = inject(DestroyRef);

  /**
   * What the customer sees in the box.
   *
   * Linked to the answer so choosing an option, or recalling a saved one, shows its
   * wording; the previous text survives when the answer is cleared, so typing over
   * a chosen option does not blank the box on the first keystroke.
   */
  readonly text = linkedSignal<AutocompleteOption | null, string>({
    source: this.value,
    computation: (option, previous) => option?.description ?? previous?.value ?? '',
  });

  readonly options = signal<readonly AutocompleteOption[]>([]);
  readonly isOpen = signal(false);
  readonly activeIndex = signal(-1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly searchedKeyword = signal('');
  private readonly keyword = new Subject<string>();

  readonly listboxId = computed(() => `${this.controlId()}-listbox`);
  readonly statusId = computed(() => `${this.controlId()}-status`);

  readonly activeDescendantId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  readonly describedByIds = computed(() => {
    const ids = [this.describedBy(), this.statusId()].filter((id): id is string => !!id);
    return ids.length > 0 ? ids.join(' ') : null;
  });

  /** Visible guidance: why there is no list, in the customer's own terms. */
  readonly hint = computed(() => {
    if (this.loading() || this.error() || this.options().length > 0) {
      return '';
    }

    const typed = this.text().trim();
    if (!typed) {
      return '';
    }

    if (typed.length < MIN_KEYWORD_LENGTH) {
      return `Type at least ${MIN_KEYWORD_LENGTH} characters to search.`;
    }

    return this.searchedKeyword() === typed ? 'No matches found.' : '';
  });

  /** The same news for a screen reader, including how to reach the results. */
  readonly status = computed(() => {
    if (this.loading()) {
      return 'Searching.';
    }

    const count = this.options().length;
    if (count > 0) {
      return `${count} ${count === 1 ? 'result' : 'results'} available. Use the up and down arrow keys to review them, then press Enter to choose.`;
    }

    return this.hint();
  });

  constructor() {
    this.keyword
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        switchMap((keyword) =>
          this.runSearch(keyword).pipe(map((results) => ({ keyword, results }))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ keyword, results }) => {
        const visible = results.slice(0, MAX_VISIBLE_OPTIONS);

        this.loading.set(false);
        this.searchedKeyword.set(keyword);
        this.options.set(visible);
        this.isOpen.set(visible.length > 0);
        this.activeIndex.set(-1);
      });

    // A recalled quote arrives as a code with no wording. Ask the backend what it
    // means rather than showing the customer a code they cannot check.
    effect(() => {
      const option = this.value();
      const source = this.source();
      if (!option?.code || option.description) {
        return;
      }

      untracked(() => this.describeCode(source, option.code));
    });
  }

  onInput(event: Event): void {
    const typed = (event.target as HTMLInputElement).value;

    this.text.set(typed);
    this.error.set(null);

    // Editing the text unresolves the answer: what is in the box is no longer the
    // option that was chosen.
    if (this.value() !== null) {
      this.value.set(null);
    }

    this.keyword.next(typed.trim());
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.options();
    const lastIndex = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (options.length === 0) {
          return;
        }

        this.isOpen.set(true);
        this.activeIndex.update((index) => Math.min(index + 1, lastIndex));
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (options.length === 0) {
          return;
        }

        this.isOpen.set(true);
        this.activeIndex.update((index) => (index <= 0 ? 0 : index - 1));
        break;

      case 'Home':
        if (this.isOpen() && options.length > 0) {
          event.preventDefault();
          this.activeIndex.set(0);
        }
        break;

      case 'End':
        if (this.isOpen() && options.length > 0) {
          event.preventDefault();
          this.activeIndex.set(lastIndex);
        }
        break;

      case 'Enter': {
        const active = this.activeIndex();
        if (this.isOpen() && active >= 0) {
          event.preventDefault();
          this.selectOption(options[active]);
        }
        break;
      }

      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;

      case 'Tab':
        this.close();
        break;
    }
  }

  /**
   * Keeps focus in the box while a match is clicked.
   *
   * `mousedown` rather than `click` so the choice is recorded before the input
   * loses focus, and the default is prevented so focus never leaves at all.
   */
  onOptionMousedown(event: MouseEvent, option: AutocompleteOption): void {
    event.preventDefault();
    this.selectOption(option);
  }

  onBlur(): void {
    this.close();
    this.touch.emit();
  }

  selectOption(option: AutocompleteOption): void {
    this.value.set(option);
    this.error.set(null);
    this.close();
  }

  optionId(index: number): string {
    return `${this.controlId()}-option-${index}`;
  }

  /** Part of the `FormUiControl` contract: focus the box, not the host element. */
  focus(options?: FocusOptions): void {
    this.inputElement()?.nativeElement.focus(options);
  }

  private close(): void {
    this.isOpen.set(false);
    this.activeIndex.set(-1);
  }

  private runSearch(keyword: string) {
    if (keyword.length < MIN_KEYWORD_LENGTH) {
      return of<readonly AutocompleteOption[]>([]);
    }

    // `defer` so the spinner appears when the request is actually made, and not
    // for a keystroke that a later one replaced.
    return defer(() => {
      this.loading.set(true);
      return this.source().search(keyword);
    }).pipe(
      catchError(() => {
        this.error.set(SEARCH_FAILED_MESSAGE);
        return of<readonly AutocompleteOption[]>([]);
      }),
    );
  }

  private describeCode(source: AutocompleteSource, code: string): void {
    source
      .describe(code)
      .pipe(
        catchError(() => of('')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((description) => {
        const current = this.value();
        // The customer may have moved on while the lookup was in flight.
        if (description && current?.code === code && !current.description) {
          this.value.set({ code, description });
        }
      });
  }
}
