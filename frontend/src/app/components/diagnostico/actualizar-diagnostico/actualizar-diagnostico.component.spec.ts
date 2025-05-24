import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarDiagnosticoComponent } from './actualizar-diagnostico.component';

describe('ActualizarDiagnosticoComponent', () => {
  let component: ActualizarDiagnosticoComponent;
  let fixture: ComponentFixture<ActualizarDiagnosticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarDiagnosticoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarDiagnosticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
