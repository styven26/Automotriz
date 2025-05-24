import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarMecanicoComponent } from './actualizar-mecanico.component';

describe('ActualizarMecanicoComponent', () => {
  let component: ActualizarMecanicoComponent;
  let fixture: ComponentFixture<ActualizarMecanicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarMecanicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarMecanicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
