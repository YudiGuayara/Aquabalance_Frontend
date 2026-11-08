import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EstacionRed, Telemetria } from '../models/estacion-red.model';

@Injectable({ providedIn: 'root' })
export class EstacionRedService {
  private readonly apiUrl = `${environment.apiUrl}/api/estaciones`;

  constructor(private http: HttpClient) {}

  listar(): Observable<EstacionRed[]> {
    return this.http.get<EstacionRed[]>(this.apiUrl);
  }

  /** Lo que haría un sensor real: enviar su telemetría al servidor por HTTP. */
  enviarTelemetria(id: number, datos: Telemetria): Observable<EstacionRed> {
    return this.http.post<EstacionRed>(`${this.apiUrl}/${id}/telemetria`, datos);
  }

  registrarPerdida(id: number): Observable<EstacionRed> {
    return this.http.post<EstacionRed>(`${this.apiUrl}/${id}/perdida`, {});
  }
}
