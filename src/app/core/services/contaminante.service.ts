import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Contaminante } from '../models/contaminante.model';

@Injectable({ providedIn: 'root' })
export class ContaminanteService {
  private apiUrl = `${environment.apiUrl}/api/monitoreo/contaminantes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Contaminante[]> {
    return this.http.get<Contaminante[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Contaminante> {
    return this.http.get<Contaminante>(`${this.apiUrl}/${id}`);
  }

  crear(contaminante: Contaminante): Observable<Contaminante> {
    return this.http.post<Contaminante>(this.apiUrl, contaminante);
  }

  actualizar(id: number, contaminante: Contaminante): Observable<Contaminante> {
    return this.http.put<Contaminante>(`${this.apiUrl}/${id}`, contaminante);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
