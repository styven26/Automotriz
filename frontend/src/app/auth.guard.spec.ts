import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';  // Asegúrate de usar 'AuthGuard' con la primera letra mayúscula
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  // Si tu AuthGuard usa HttpClient
      providers: [AuthGuard, { provide: Router, useClass: class { navigate = jasmine.createSpy("navigate"); }}] // Simulación de Router
    });
    guard = TestBed.inject(AuthGuard);  // Inyectar el AuthGuard
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();  // Verificar que el guard ha sido creado correctamente
  });
});
