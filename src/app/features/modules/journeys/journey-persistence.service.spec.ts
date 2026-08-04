import { TestBed } from '@angular/core/testing';
import { ClockService } from '../../../core/services/clock.service';
import { JourneySessionService } from '../../../core/services/journey-session.service';
import { JourneyStateService } from '../../../core/services/journey-state.service';
import { ModuleContextService } from '../../../core/services/module-context.service';
import {
  type PartialStoreRequest,
  type PartialStoreResponse,
  QuotePartialStoreService,
} from '../../../core/services/quote-partial-store.service';
import { JourneyPersistenceService } from './journey-persistence.service';
import { getFirstStep, getJourneyForModule } from './journey-registry';

class FakePartialStore {
  readonly calls: PartialStoreRequest[] = [];
  failNext = false;
  private counter = 0;

  readonly configuredDomain = 'quotelinedirect.co.uk';

  store(request: PartialStoreRequest): Promise<PartialStoreResponse> {
    this.calls.push(request);

    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error('store unavailable'));
    }

    this.counter += 1;
    return Promise.resolve({
      parameters: {
        module: request.module,
        reference: `REF-${this.counter}`,
        transaction_id: `TXN-${this.counter}`,
      },
    });
  }
}

class FakeModuleContext {
  partialStoreEnabled = true;
  loaded: string[] = [];

  ensureLoaded(moduleCode: string): Promise<null> {
    this.loaded.push(moduleCode);
    return Promise.resolve(null);
  }

  allowsPartialStore(): boolean {
    return this.partialStoreEnabled;
  }
}

class FixedClock {
  today(): string {
    return '04/08/2026';
  }
}

describe('JourneyPersistenceService', () => {
  let service: JourneyPersistenceService;
  let store: FakePartialStore;
  let context: FakeModuleContext;
  let session: JourneySessionService;
  let journeyState: JourneyStateService;

  beforeEach(() => {
    store = new FakePartialStore();
    context = new FakeModuleContext();

    TestBed.configureTestingModule({
      providers: [
        { provide: QuotePartialStoreService, useValue: store },
        { provide: ModuleContextService, useValue: context },
        { provide: ClockService, useValue: new FixedClock() },
      ],
    });

    service = TestBed.inject(JourneyPersistenceService);
    session = TestBed.inject(JourneySessionService);
    journeyState = TestBed.inject(JourneyStateService);
    session.clear('PC');
    journeyState.resetAll();
  });

  it('creates the partial once and reuses the reference', async () => {
    const first = await service.ensureCreated('PC');
    const second = await service.ensureCreated('PC');

    expect(first).toBe('REF-1');
    expect(second).toBe('REF-1');
    expect(store.calls).toHaveLength(1);
    expect(session.reference('PC')).toBe('REF-1');
  });

  it('sends the required parameters on the create call', async () => {
    await service.ensureCreated('PC');
    const [call] = store.calls;

    expect(call['module']).toBe('PC');
    expect(call['domain']).toBe('quotelinedirect.co.uk');
    expect(call['step']).toBe(getFirstStep(getJourneyForModule('PC')!).storeStep);
    expect(call['sessionid']).toBe(session.session('PC')?.sessionId);
    // Not captured until step 4, so the create falls back to today.
    expect(call['policy-inceptiondate']).toBe('04/08/2026');
    expect(call['reference']).toBeUndefined();
  });

  it('does not create twice when called concurrently', async () => {
    await Promise.all([service.ensureCreated('PC'), service.ensureCreated('PC')]);

    expect(store.calls).toHaveLength(1);
  });

  it('waits for module parameters before creating', async () => {
    await service.ensureCreated('PC');

    expect(context.loaded).toContain('PC');
  });

  it('includes the reference and the answers on a step update', async () => {
    await service.ensureCreated('PC');
    journeyState.setSectionAnswers('PC', 'your-vehicle', 'vehicle', {
      'vehicle-regnumber': 'AB12CDE',
      'policy-totalmileage': 12000,
    });

    const journey = getJourneyForModule('PC')!;
    const step = journey.steps[1];
    await service.recordStep('PC', step);

    const update = store.calls[1];
    expect(update['reference']).toBe('REF-1');
    expect(update['step']).toBe(step.storeStep);
    expect(update['vehicle-regnumber']).toBe('AB12CDE');
    expect(update['policy-totalmileage']).toBe('12000');
  });

  it('prefers a captured inception date over today', async () => {
    journeyState.setSectionAnswers('PC', 'your-policy', 'policy', {
      'policy-inceptiondate': '01/09/2026',
    });

    await service.ensureCreated('PC');

    expect(store.calls[0]['policy-inceptiondate']).toBe('01/09/2026');
  });

  it('sends booleans in the Y/N form the backend expects', async () => {
    await service.ensureCreated('PC');
    journeyState.setSectionAnswers('PC', 'your-policy', 'policy', { declarationAccepted: true });

    await service.recordStep('PC', getJourneyForModule('PC')!.steps[3]);

    expect(store.calls[1]['declarationAccepted']).toBe('Y');
  });

  it('makes no calls at all when the module has partial storing disabled', async () => {
    context.partialStoreEnabled = false;

    const reference = await service.ensureCreated('PC');
    await service.recordStep('PC', getJourneyForModule('PC')!.steps[1]);

    expect(reference).toBeNull();
    expect(store.calls).toHaveLength(0);
  });

  it('retries the create on the next step when it failed first time', async () => {
    store.failNext = true;

    expect(await service.ensureCreated('PC')).toBeNull();
    expect(session.reference('PC')).toBeNull();

    await service.recordStep('PC', getJourneyForModule('PC')!.steps[1]);

    // One failed create, then a successful create plus the update.
    expect(store.calls).toHaveLength(3);
    expect(session.reference('PC')).not.toBeNull();
  });

  it('never rejects when the store is unavailable', async () => {
    await service.ensureCreated('PC');
    store.failNext = true;

    await expect(
      service.recordStep('PC', getJourneyForModule('PC')!.steps[1]),
    ).resolves.toBeUndefined();
  });
});
