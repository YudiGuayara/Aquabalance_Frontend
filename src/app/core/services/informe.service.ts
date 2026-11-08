import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Informe } from '../models/informe.model';

@Injectable({ providedIn: 'root' })
export class InformeService {

  private apiUrl = `${environment.apiUrl}/api/informes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Informe[]> {
    return this.http.get<Informe[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Informe> {
    return this.http.get<Informe>(`${this.apiUrl}/${id}`);
  }

  crear(informe: Informe): Observable<Informe> {
    return this.http.post<Informe>(this.apiUrl, informe);
  }

  actualizar(id: number, informe: Informe): Observable<Informe> {
    return this.http.put<Informe>(`${this.apiUrl}/${id}`, informe);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
