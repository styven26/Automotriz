import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMecanicoComponent } from './dashboard-mecanico.component';

describe('DashboardMecanicoComponent', () => {
  let component: DashboardMecanicoComponent;
  let fixture: ComponentFixture<DashboardMecanicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardMecanicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardMecanicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
