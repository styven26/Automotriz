import { TestBed } from '@angular/core/testing';

import { CitaMecanicoService } from './cita-mecanico.service';

describe('CitaMecanicoService', () => {
  let service: CitaMecanicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CitaMecanicoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
