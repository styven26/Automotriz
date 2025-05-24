import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearMecanicoComponent } from './crear-mecanico.component';

describe('CrearMecanicoComponent', () => {
  let component: CrearMecanicoComponent;
  let fixture: ComponentFixture<CrearMecanicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearMecanicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearMecanicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
