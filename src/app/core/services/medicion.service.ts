import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medicion } from '../models/medicion.model';

@Injectable({ providedIn: 'root' })
export class MedicionService {

  private apiUrl = `${environment.apiUrl}/api/monitoreo/mediciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Medicion[]> {
    return this.http.get<Medicion[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Medicion> {
    return this.http.get<Medicion>(`${this.apiUrl}/${id}`);
  }

  listarPorRecurso(idRecurso: number): Observable<Medicion[]> {
    return this.http.get<Medicion[]>(`${this.apiUrl}/recurso/${idRecurso}`);
  }

  registrar(medicion: Medicion): Observable<Medicion> {
    return this.http.post<Medicion>(this.apiUrl, medicion);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, data: Medicion): Observable<Medicion> {
    return this.http.put<Medicion>(`${this.apiUrl}/${id}`, data);
  }
}
