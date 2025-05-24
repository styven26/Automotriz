import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoOrdenServicioComponent } from './tipo-orden-servicio.component';

describe('TipoOrdenServicioComponent', () => {
  let component: TipoOrdenServicioComponent;
  let fixture: ComponentFixture<TipoOrdenServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TipoOrdenServicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipoOrdenServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
