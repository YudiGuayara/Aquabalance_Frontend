import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { PuntoMapa } from '../models/mapa.model';

@Injectable({
  providedIn: 'root'
})
export class MapaService {

  private apiUrl = 'http://localhost:8080/api/recursos';

  constructor(private http: HttpClient) {}

  getPuntos(): Observable<PuntoMapa[]> {
    return this.http.get<PuntoMapa[]>(this.apiUrl);
  }

}
