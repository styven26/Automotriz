import { TestBed } from '@angular/core/testing';

import { DetalleRepuestoService } from './detallerepuesto.service';

describe('DetallerepuestoService', () => {
  let service: DetalleRepuestoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleRepuestoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
