import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubtiposServiciosComponent } from './subtipos-servicios.component';

describe('SubtiposServiciosComponent', () => {
  let component: SubtiposServiciosComponent;
  let fixture: ComponentFixture<SubtiposServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubtiposServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubtiposServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
