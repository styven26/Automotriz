import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitaMecanicoService {

  private apiUrlMecanico = 'http://localhost:8000/api/mecanico/citas'; // URL para las rutas de mecánico

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }

  // Listar citas asignadas al mecánico autenticado
  listarCitasMecanico(): Observable<any[]> {
    return this.http
      .get<{ data: any[] } | any[]>(`${this.apiUrlMecanico}`, {
        headers: this.getHeaders()
      })
      .pipe(
        tap(res => console.log('RAW citas:', res)),
        map(res => (res as any).data ?? (res as any))  // extrae data[] si viene anidado
      );
  }
}