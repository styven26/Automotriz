import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarVehiculoComponent } from './actualizar-vehiculo.component';

describe('ActualizarVehiculoComponent', () => {
  let component: ActualizarVehiculoComponent;
  let fixture: ComponentFixture<ActualizarVehiculoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarVehiculoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarVehiculoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
