import { TestBed } from '@angular/core/testing';

import { DetalleservicioService } from './detalleservicio.service';

describe('DetalleservicioService', () => {
  let service: DetalleservicioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleservicioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
