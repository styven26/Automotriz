import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiposServiciosComponent } from './tipos-servicios.component';

describe('TiposServiciosComponent', () => {
  let component: TiposServiciosComponent;
  let fixture: ComponentFixture<TiposServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiposServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
