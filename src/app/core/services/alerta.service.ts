import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alerta, NivelAlerta } from '../models/alerta.model';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private apiUrl = `${environment.apiUrl}/api/alertas`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Alerta> {
    return this.http.get<Alerta>(`${this.apiUrl}/${id}`);
  }

  listarPorNivel(nivel: NivelAlerta): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.apiUrl}/nivel/${nivel}`);
  }

  listarPorEvento(idEvento: number): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${this.apiUrl}/evento/${idEvento}`);
  }

  crear(alerta: Alerta): Observable<Alerta> {
    return this.http.post<Alerta>(this.apiUrl, alerta);
  }

  actualizar(id: number, alerta: Alerta): Observable<Alerta> {
    return this.http.put<Alerta>(`${this.apiUrl}/${id}`, alerta);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
