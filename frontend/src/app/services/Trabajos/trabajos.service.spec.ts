import { TestBed } from '@angular/core/testing';

import { TrabajosService } from './trabajos.service';

describe('TrabajosService', () => {
  let service: TrabajosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrabajosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
