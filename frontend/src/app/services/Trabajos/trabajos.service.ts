import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TrabajosService {
  
  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Listar los trabajos asignados al mecánico autenticado.
  listarTrabajos(): Observable<any[]> {
    const headers = this.getAuthHeaders(); // Obtiene las cabeceras de autenticación
    return this.http.get<any[]>(`${this.baseUrl}/mecanico/`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los trabajos:', error);
        return of([]); // Devuelve un array vacío en caso de error
      })
    );
  }  

  // Listar los trabajos confirmados asignados al mecánico autenticado.
  listarTrabajosConfirmados(): Observable<any[]> {
    const headers = this.getAuthHeaders(); // Obtiene las cabeceras de autenticación
    return this.http.get<any[]>(`${this.baseUrl}/mecanico/trabajos-confirmadas`, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener los trabajos:', error);
        return of([]); // Devuelve un array vacío en caso de error
      })
    );
  }

  // Asignar un nuevo trabajo (incluye la creación de monitoreo).
  asignarTrabajo(idCita: number, idVehiculo: number, idMecanico: number): Observable<any> {
    const payload = { id_cita: idCita, id_vehiculo: idVehiculo, id_mecanico: idMecanico };
    const headers = this.getAuthHeaders();
    return this.http.post<any>(
      `${this.baseUrl}/mecanico/trabajos/asignar`,
      payload,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('Error al asignar trabajo:', error);
        return of(null); // Devuelve null en caso de error
      })
    );
  }

  // Actualizar los progresos de los subtipos
  actualizarProgresos(idTrabajo: number, progresos: any[]): Observable<any> {
    const headers = this.getAuthHeaders();
    const payload = { progresos };
    return this.http.put<any>(
      `${this.baseUrl}/mecanico/trabajos/${idTrabajo}/actualizar-progresos`,
      payload,
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('Error al actualizar progresos:', error);
        return of({ error: 'No se pudo actualizar los progresos' });
      })
    );
  }

  // Actualizar las descripciones de los subtipos
  actualizarDescripciones(idTrabajo: number, descripciones: any[]): Observable<any> {
    const headers = this.getAuthHeaders();
    const payload = { descripciones };
    return this.http.put<any>(`${this.baseUrl}/mecanico/trabajos/${idTrabajo}/descripciones`, payload, { headers }).pipe(
      catchError((error) => {
        console.error('Error al actualizar descripciones:', error);
        return of({ error: 'No se pudo actualizar las descripciones' });
      })
    );
  }

  completarTrabajo(idTrabajo: number): Observable<any> {
    const headers = this.getAuthHeaders();
    // No se envía payload ya que el backend asigna la fecha y hora actuales automáticamente.
    return this.http.put<any>(
      `${this.baseUrl}/mecanico/trabajos/${idTrabajo}/completar`,
      {},
      { headers }
    ).pipe(
      catchError((error) => {
        console.error('Error al completar el trabajo:', error);
        return of({ error: 'No se pudo completar el trabajo' });
      })
    );
  }         

  finalizarTrabajoAutomatico(idTrabajo: number): Observable<any> {
    const headers = this.getAuthHeaders();
    // No se envía payload, ya que el backend usa now() para generar la fecha/hora
    return this.http.post<any>(
      `${this.baseUrl}/mecanico/trabajos/${idTrabajo}/finalizar-automatico`,
      {},
      { headers }
    );
  }      

  descargarReporte(): void {
    const url = 'http://localhost:8000/api/mecanico/reporte-trabajos';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
        next: (response: Blob) => {
            const blob = new Blob([response], { type: 'application/pdf' });
            const downloadURL = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadURL;
            link.download = 'reporte-trabajos.pdf';
            link.click();
        },
        error: (err) => {
            console.error('Error al descargar el reporte:', err);
        }
    });
  }
}