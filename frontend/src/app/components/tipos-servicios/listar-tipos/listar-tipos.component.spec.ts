import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarTiposComponent } from './listar-tipos.component';

describe('ListarTiposComponent', () => {
  let component: ListarTiposComponent;
  let fixture: ComponentFixture<ListarTiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListarTiposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarTiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
