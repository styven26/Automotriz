import { TestBed } from '@angular/core/testing';

import { DiagnosticoService } from './diagnostico.service';

describe('DiagnosticoService', () => {
  let service: DiagnosticoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagnosticoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
