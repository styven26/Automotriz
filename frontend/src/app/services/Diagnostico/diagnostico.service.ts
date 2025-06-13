// src/app/services/Diagnostico/diagnostico.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticoService {

  // Ajusta la URL a la ruta real de tu backend para mecánicos
  private apiUrlMecanico = 'http://localhost:8000/api/mecanico/citas'; 
  private apiUrlDiagnosticos = 'http://localhost:8000/api/mecanico/diagnosticos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Envía un diagnóstico para la cita indicada.
   * @param citaId ID de la cita
   * @param descripcion Texto ingresado por el mecánico
   * @param serviciosRecomendados Array de servicios sugeridos (opcional)
   */
  registrarDiagnostico(citaId: number, descripcion: string, serviciosRecomendados: any[] = []): Observable<any> {
    const body = {
      descripcion,
      servicios_recomendados: serviciosRecomendados
    };

    return this.http.post(
      `${this.apiUrlMecanico}/${citaId}/diagnostico`,
      body,
      { headers: this.getHeaders() }
    );
  }

  guardarDiagnostico(
    citaId: number,
    descripcion: string,
    serviciosRecomendados: any[] = []
  ): Observable<any> {
    const body = { descripcion, servicios_recomendados: serviciosRecomendados };
    return this.http.post(
      `${this.apiUrlMecanico}/${citaId}/diagnostico`,
      body,
      { headers: this.getHeaders() }
    );
  }

  // src/app/services/Diagnostico/diagnostico.service.ts
  listarDiagnosticos(): Observable<any> {
    return this.http.get(
      'http://localhost:8000/api/mecanico/diagnosticos', 
      { headers: this.getHeaders() }
    );
  }

  /** ACTUALIZA un diagnóstico existente (PUT) */
  updateDiagnostico(
    diagnosticoId: number,
    descripcion: string,
    serviciosRecomendados: number[]
  ): Observable<any> {
    return this.http.put(
      `${this.apiUrlDiagnosticos}/${diagnosticoId}`,
      { descripcion, servicios_recomendados: serviciosRecomendados },
      { headers: this.getHeaders() }
    );
  }

  enviarCorreoSinServicios(diagnosticoId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrlDiagnosticos}/${diagnosticoId}/enviarCorreoSinServicios`,
      {},
      { headers: this.getHeaders() }
    );
  }
  
  enviarCorreoServiciosRecomendados(diagnosticoId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrlDiagnosticos}/${diagnosticoId}/enviarCorreoServiciosRecomendados`,
      {},
      { headers: this.getHeaders() }
    );
  }
  
}
