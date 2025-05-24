import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarHorariosComponent } from './actualizar-horarios.component';

describe('ActualizarHorariosComponent', () => {
  let component: ActualizarHorariosComponent;
  let fixture: ComponentFixture<ActualizarHorariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarHorariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarHorariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
