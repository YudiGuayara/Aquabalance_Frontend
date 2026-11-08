import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { MapaService, calcularEstado } from './mapa.service';
import { environment } from '../../../environments/environment';
import { PuntoMapa } from '../models/mapa.model';

describe('calcularEstado', () => {

  it('pH y temperatura normales -> estable', () => {
    expect(calcularEstado(7.0, 22)).toBe('estable');
  });

  it('pH fuera del rango óptimo pero seguro -> medio', () => {
    expect(calcularEstado(5.5, 22)).toBe('medio');
    expect(calcularEstado(8.8, 22)).toBe('medio');
  });

  it('pH crítico o temperatura crítica -> critico', () => {
    expect(calcularEstado(4.5, 22)).toBe('critico');
    expect(calcularEstado(9.5, 22)).toBe('critico');
    expect(calcularEstado(7.0, 36)).toBe('critico');
  });

  it('temperatura elevada -> medio', () => {
    expect(calcularEstado(7.0, 32)).toBe('medio');
  });
});

describe('MapaService', () => {
  let service: MapaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MapaService);
    http = TestBed.inject(HttpTestingController);
  });

  it('arma un punto por recurso con la ÚLTIMA medición y omite recursos sin coordenadas', () => {
    let puntos: PuntoMapa[] = [];
    service.getPuntos().subscribe(p => (puntos = p));

    http.expectOne(`${environment.apiUrl}/api/monitoreo/recursos`).flush([
      { id: 1, nombre: 'Río Cauca', tipo: 'Rio', ubicacion: 'Cali', latitud: 3.45, longitud: -76.53 },
      { id: 2, nombre: 'Lago Calima', tipo: 'Lago', ubicacion: 'Valle', latitud: 3.9, longitud: -76.3 },
      { id: 3, nombre: 'Sin coordenadas', tipo: 'Rio', ubicacion: '-', latitud: 0, longitud: 0 },
    ]);
    http.expectOne(`${environment.apiUrl}/api/monitoreo/mediciones`).flush([
      // medición vieja del recurso 1 (estable) y una más nueva (crítica)
      { id: 10, ph: 7.0, temperatura: 20, fecha: '2026-11-01T10:00', idRecurso: 1, idContaminante: 1 },
      { id: 11, ph: 4.2, temperatura: 20, fecha: '2026-11-05T09:30', idRecurso: 1, idContaminante: 1,
        nombreContaminante: 'Mercurio' },
    ]);

    expect(puntos.length).toBe(2);

    const cauca = puntos.find(p => p.id === 1)!;
    expect(cauca.estado).toBe('critico');
    expect(cauca.ph).toBe(4.2);
    expect(cauca.contaminante).toBe('Mercurio');

    const calima = puntos.find(p => p.id === 2)!;
    expect(calima.estado).toBe('sin-datos');
    expect(calima.ph).toBeUndefined();

    http.verify();
  });
});
