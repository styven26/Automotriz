import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosticoComponent } from './diagnostico.component';

describe('DiagnosticoComponent', () => {
  let component: DiagnosticoComponent;
  let fixture: ComponentFixture<DiagnosticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagnosticoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagnosticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
