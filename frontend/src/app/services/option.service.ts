import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OptionItem {
  id:   string;
  name: string;
}

export interface OptionsResponse {
  transmissions:   OptionItem[];
  fuel_types:      OptionItem[];
  especialidades:  OptionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class OptionService {
  /** Punto base de acceso al API de catálogos */
  private readonly base = 'http://localhost:8000/api/admin/options';

  constructor(private http: HttpClient) {}

  /** Construye los headers con el token JWT */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**  
   * Obtiene todas las listas de opciones:  
   * - transmissions  
   * - fuel_types  
   * - especialidades  
   */
  list(): Observable<OptionsResponse> {
    return this.http.get<OptionsResponse>(
      `${this.base}`,
      { headers: this.getHeaders() }
    );
  }

  /** Transmissions */
  addTrans(name: string): Observable<OptionItem[]> {
    return this.http.post<OptionItem[]>(
      `${this.base}/transmissions`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  delTrans(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/transmissions/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /** Fuel Types */
  addFuel(name: string): Observable<OptionItem[]> {
    return this.http.post<OptionItem[]>(
      `${this.base}/fuel-types`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  delFuel(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/fuel-types/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /** Especialidades */
  addEspecialidad(name: string): Observable<OptionItem[]> {
    return this.http.post<OptionItem[]>(
      `${this.base}/especialidades`,
      { name },
      { headers: this.getHeaders() }
    );
  }

  delEspecialidad(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.base}/especialidades/${id}`,
      { headers: this.getHeaders() }
    );
  }
}
