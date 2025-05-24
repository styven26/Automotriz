import { TestBed } from '@angular/core/testing';

import { CitaadminService } from './citaadmin.service';

describe('CitaadminService', () => {
  let service: CitaadminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CitaadminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
