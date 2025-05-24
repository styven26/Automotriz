import { TestBed } from '@angular/core/testing';

import { DetallerepuestoService } from './detallerepuesto.service';

describe('DetallerepuestoService', () => {
  let service: DetallerepuestoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetallerepuestoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
