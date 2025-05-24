import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActualizarSubtiposComponent } from './actualizar-subtipos.component';

describe('ActualizarSubtiposComponent', () => {
  let component: ActualizarSubtiposComponent;
  let fixture: ComponentFixture<ActualizarSubtiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActualizarSubtiposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActualizarSubtiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
