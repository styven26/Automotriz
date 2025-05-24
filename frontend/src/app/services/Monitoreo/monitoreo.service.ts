import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Define la interfaz Monitoreo para tipar los datos
export interface Monitoreo {
  id: number;
  etapa: 'Diagnóstico' | 'Reparación' | 'Finalización' | 'Cancelado';
  vehiculo: {
    marca: string;
    modelo: string;
  };
  servicios: {
    nombre: string;
    progreso: number;
  }[]; // Lista de servicios con su progreso
}

@Injectable({
  providedIn: 'root',
})
export class MonitoreoService {
  private apiUrl = 'http://localhost:8000/api/cliente/monitoreos'; // URL del endpoint

  constructor(private http: HttpClient) {}

  // Método para obtener todos los monitoreos del cliente autenticado
  obtenerTodosMonitoreos(): Observable<Monitoreo[]> {
    const token = sessionStorage.getItem('token'); // Obtener el token del cliente
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<Monitoreo[]>(this.apiUrl, { headers });
  }
}
