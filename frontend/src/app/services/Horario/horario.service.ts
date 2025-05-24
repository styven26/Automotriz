import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = 'http://localhost:8000/api/public/horarios'; // URL de tu API en Laravel

  constructor(private http: HttpClient) {}

  // Obtener todos los horarios
  getHorarios(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Verificar si ya existe un horario en el mismo día
  verificarFranjaHoraria(horarioData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/verificar`, horarioData);
  }

  // Crear un nuevo horario
  createHorario(horario: any): Observable<any> {
    return this.http.post(this.apiUrl, horario);
  }

  // Actualizar un horario existente
  updateHorario(id: number, horarioData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, horarioData);
  }

  // Eliminar un horario
  deleteHorario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}