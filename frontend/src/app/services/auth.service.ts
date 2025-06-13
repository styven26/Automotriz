import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api'; // URL base del backend Laravel

  constructor(private http: HttpClient, private router: Router) {}

  // Método para iniciar sesión
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response: any) => {
        // 1) Almacenar el token
        localStorage.setItem('token', response.token);

        // 2) Almacenar los roles
        localStorage.setItem('roles', JSON.stringify(response.roles));

        // 3) Almacenar la información del usuario
        localStorage.setItem('user', JSON.stringify(response.user));

        // 4) Calcular y almacenar tiempo de expiración del token
        const currentTime = Math.floor(Date.now() / 1000);           // Ahora en segundos
        const expirationTime = currentTime + response.expires_in;    // + duración del token
        localStorage.setItem('token_expiration', expirationTime.toString());

        // 5) Elegir rol activo según prioridad
        const roles: string[] = response.roles;
        const prioridad = ['admin', 'mecanico', 'vendedor', 'cliente'];
        const rolActivo = prioridad.find(r => roles.includes(r)) || roles[0] || null;
        localStorage.setItem('rol_activo', rolActivo!);

        // 6) Redirigir al dashboard correspondiente
        this.redirectUser(rolActivo!);
      }),
      catchError((error) => {
        console.error('Error en el login:', error);
        return throwError(() => new Error('Error al iniciar sesión'));
      })
    );
  }

  // Cambiar de rol
  cambiarRol(nuevoRol: string): Observable<{ rol_activo: string }> {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
    return this.http.post<{ rol_activo: string }>(
      `${this.apiUrl}/auth/cambiar-rol`,
      { rol: nuevoRol },
      { headers }
    ).pipe(
      tap(r => localStorage.setItem('rol_activo', r.rol_activo))
    );
  }

  private redirectUser(rolActivo: string): void {
    switch (rolActivo) {
      case 'admin':
        this.router.navigate(['/dashboard-admin']);
        break;
      case 'mecanico':
        this.router.navigate(['/dashboard-mecanico']);
        break;
      case 'vendedor':
        this.router.navigate(['/dashboard-vendedor']);
        break;
      case 'cliente':
        this.router.navigate(['/dashboard-clientes']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  } 

  // Método para registrar usuarios (opcional)
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData).pipe(
      tap((response) => console.log('Registro exitoso:', response)),
      catchError((error) => {
        return throwError(() => error); // Propaga errores del backend
      })
    );
  }

  // Método para cerrar sesión
  logout(): void {
    // Limpia todos los datos de autenticación
    localStorage.clear();

    // Redirige al login
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Recarga la página para asegurarte de limpiar el estado
    });
  }

  getUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  // Obtener roles
  getRoles(): string[] {
    return JSON.parse(localStorage.getItem('roles') || '[]');
  }

  // Obtener token almacenado
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Devuelve el rol activo desde localStorage
   */
  getRolActivo(): string | null {
    return localStorage.getItem('rol_activo');
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiration = localStorage.getItem('token_expiration');
    if (!token || !expiration) {
      return false;
    }
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    return currentTime < parseInt(expiration, 10); // Verifica si el token no ha expirado
  }

  // Obtener datos del Dashboard del administrador
  getAdminDashboardStats(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.get(`${this.apiUrl}/admin/dashboard`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener datos del dashboard:', error);
        return throwError(() => new Error('Error al cargar las estadísticas del dashboard'));
      })
    );
  }

  // Obtener citas y clientes por mes
  getCitasYClientesPorMes(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    return this.http.get(`${this.apiUrl}/admin/dashboard/citas-clientes`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener citas y clientes por mes:', error);
        return throwError(() => new Error('Error al cargar los datos del gráfico'));
      })
    );
  }

  // Enviar enlace de reseteo de contraseña
  sendResetLink(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/password/reset`, data).pipe(
      catchError((error) => {
        console.error('Error al enviar el enlace de recuperación:', error);
        return throwError(() => error);
      })
    );
  }

  // Confirmar reseteo de contraseña
  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/password/reset/confirm`, data);
  }
}
