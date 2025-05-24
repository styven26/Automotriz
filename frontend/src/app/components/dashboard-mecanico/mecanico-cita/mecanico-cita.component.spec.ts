import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MecanicoCitaComponent } from './mecanico-cita.component';

describe('MecanicoCitaComponent', () => {
  let component: MecanicoCitaComponent;
  let fixture: ComponentFixture<MecanicoCitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MecanicoCitaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MecanicoCitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
