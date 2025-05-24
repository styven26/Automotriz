import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarRepuestosComponent } from './actualizar-repuestos.component';

describe('ActualizarRepuestosComponent', () => {
  let component: ActualizarRepuestosComponent;
  let fixture: ComponentFixture<ActualizarRepuestosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarRepuestosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarRepuestosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
