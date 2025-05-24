import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarCitaComponent } from './actualizar-cita.component';

describe('ActualizarCitaComponent', () => {
  let component: ActualizarCitaComponent;
  let fixture: ComponentFixture<ActualizarCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarCitaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
