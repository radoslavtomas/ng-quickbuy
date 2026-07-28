import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface StepSubmitRequest {
  moduleCode: string;
  stepName: string;
}

@Injectable({ providedIn: 'root' })
export class StepNavigationService {
  private readonly submitNextSubject = new Subject<StepSubmitRequest>();

  readonly submitNext$ = this.submitNextSubject.asObservable();

  requestSubmitNext(request: StepSubmitRequest): void {
    this.submitNextSubject.next(request);
  }
}
