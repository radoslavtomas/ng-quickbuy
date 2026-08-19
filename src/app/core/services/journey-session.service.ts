import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

/** What identifies one attempt at a quote, for the life of that journey. */
export interface JourneySession {
  /** UUID generated when the customer enters the journey. */
  readonly sessionId: string;
  /** Quote reference returned by the first partial store, once it exists. */
  readonly reference: string | null;
  /** Latest partial-store transaction id, kept for support and diagnostics. */
  readonly transactionId: string | null;
}

const STORAGE_PREFIX = 'ngqb.session.';

/**
 * Owns the session id and quote reference for each journey.
 *
 * Both are persisted in `sessionStorage` so a reload or a deep link into a later
 * step continues the same partial quote instead of creating a second one. Neither
 * value is personal data: the session id is a random UUID and the reference is an
 * opaque handle that still requires identity fields to read a quote back.
 */
@Injectable({ providedIn: 'root' })
export class JourneySessionService {
  private readonly document = inject(DOCUMENT);
  private readonly sessions = signal<Readonly<Record<string, JourneySession>>>({});

  /** Sessions currently known, for templates that need to react to a new reference. */
  readonly all = computed(() => this.sessions());

  /**
   * Returns the session for a module, creating it on first use.
   *
   * Idempotent by design: a resolver re-run, a double navigation or a reload must
   * reuse the existing session, otherwise one journey would produce several
   * partial quotes.
   */
  ensureSession(moduleCode: string): JourneySession {
    const key = this.key(moduleCode);
    const existing = this.sessions()[key] ?? this.readStored(key);
    if (existing) {
      if (!this.sessions()[key]) {
        this.sessions.update(current => ({ ...current, [key]: existing }));
      }
      return existing;
    }

    const created: JourneySession = {
      sessionId: this.createSessionId(),
      reference: null,
      transactionId: null,
    };
    this.write(key, created);
    return created;
  }

  session(moduleCode: string): JourneySession | null {
    const key = this.key(moduleCode);
    return this.sessions()[key] ?? this.readStored(key);
  }

  reference(moduleCode: string): string | null {
    return this.session(moduleCode)?.reference ?? null;
  }

  /** Records the reference the partial store returned for this journey. */
  setReference(moduleCode: string, reference: string, transactionId: string | null): void {
    const key = this.key(moduleCode);
    const current = this.sessions()[key] ?? this.readStored(key);
    if (!current) {
      return;
    }

    this.write(key, { ...current, reference, transactionId });
  }

  /** Clears a journey's session, on completion or when the customer switches product. */
  clear(moduleCode: string): void {
    const key = this.key(moduleCode);

    this.sessions.update(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    this.storage()?.removeItem(STORAGE_PREFIX + key);
  }

  /** Clears all journey sessions so the next journey starts with a fresh id/reference. */
  clearAll(): void {
    this.sessions.set({});

    const storage = this.storage();
    if (!storage) {
      return;
    }

    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      storage.removeItem(key);
    }
  }

  private createSessionId(): string {
    const uuid = this.document.defaultView?.crypto?.randomUUID;
    if (!uuid) {
      // Only available in a secure context. Failing here is deliberate: a
      // predictable id would silently let partial quotes collide.
      throw new Error(
        'crypto.randomUUID() is unavailable. A journey session needs a secure context (HTTPS or localhost).',
      );
    }

    return this.document.defaultView!.crypto.randomUUID();
  }

  private write(key: string, session: JourneySession): void {
    this.sessions.update(current => ({ ...current, [key]: session }));

    try {
      this.storage()?.setItem(STORAGE_PREFIX + key, JSON.stringify(session));
    } catch {
      // Storage can be unavailable or full (private browsing, quota). The journey
      // still works for this page view; only resume-after-reload is lost.
    }
  }

  private readStored(key: string): JourneySession | null {
    try {
      const raw = this.storage()?.getItem(STORAGE_PREFIX + key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<JourneySession>;
      return typeof parsed.sessionId === 'string'
        ? {
            sessionId: parsed.sessionId,
            reference: typeof parsed.reference === 'string' ? parsed.reference : null,
            transactionId: typeof parsed.transactionId === 'string' ? parsed.transactionId : null,
          }
        : null;
    } catch {
      return null;
    }
  }

  private storage(): Storage | null {
    try {
      return this.document.defaultView?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private key(moduleCode: string): string {
    return moduleCode.toUpperCase();
  }
}
