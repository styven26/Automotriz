import { TestBed } from '@angular/core/testing';

import { MecanicoService } from './mecanico.service';

describe('MecanicoService', () => {
  let service: MecanicoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MecanicoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
