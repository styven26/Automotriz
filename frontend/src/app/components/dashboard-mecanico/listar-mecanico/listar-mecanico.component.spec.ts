import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarMecanicoComponent } from './listar-mecanico.component';

describe('ListarMecanicoComponent', () => {
  let component: ListarMecanicoComponent;
  let fixture: ComponentFixture<ListarMecanicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarMecanicoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarMecanicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
