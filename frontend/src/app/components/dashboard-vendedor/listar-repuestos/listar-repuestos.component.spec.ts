import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarRepuestosComponent } from './listar-repuestos.component';

describe('ListarRepuestosComponent', () => {
  let component: ListarRepuestosComponent;
  let fixture: ComponentFixture<ListarRepuestosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarRepuestosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarRepuestosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
