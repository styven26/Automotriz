import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CitasAdminComponent } from './citas-admin.component';

describe('CitasAdminComponent', () => {
  let component: CitasAdminComponent;
  let fixture: ComponentFixture<CitasAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitasAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CitasAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
