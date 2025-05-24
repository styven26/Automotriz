import { TestBed } from '@angular/core/testing';

import { SubtipoService } from './subtipo.service';

describe('SubtipoService', () => {
  let service: SubtipoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubtipoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
