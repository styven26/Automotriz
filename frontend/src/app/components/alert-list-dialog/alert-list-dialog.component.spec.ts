import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertListDialogComponent } from './alert-list-dialog.component';

describe('AlertListDialogComponent', () => {
  let component: AlertListDialogComponent;
  let fixture: ComponentFixture<AlertListDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertListDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertListDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
