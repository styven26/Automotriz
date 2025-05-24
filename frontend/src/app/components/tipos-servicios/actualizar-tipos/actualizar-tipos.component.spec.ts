import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarTiposComponent } from './actualizar-tipos.component';

describe('ActualizarTiposComponent', () => {
  let component: ActualizarTiposComponent;
  let fixture: ComponentFixture<ActualizarTiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarTiposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarTiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
