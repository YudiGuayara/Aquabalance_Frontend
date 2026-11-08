import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { EstadoRecurso, PuntoMapa } from '../models/mapa.model';
import { Medicion } from '../models/medicion.model';
import { Recurso } from '../models/recurso.model';
import { MedicionService } from './medicion.service';
import { RecursoService } from './recurso.service';

// Mismos umbrales que MedicionService (backend). Si cambian allá, cambiarlos aquí.
const PH_CRITICO_MIN = 5.0;
const PH_CRITICO_MAX = 9.0;
const PH_ADVERTENCIA_MIN = 6.0;
const PH_ADVERTENCIA_MAX = 8.5;
const TEMP_CRITICA_MAX = 35.0;
const TEMP_ADVERTENCIA_MAX = 30.0;

export function calcularEstado(ph: number, temperatura: number): EstadoRecurso {
  if (ph < PH_CRITICO_MIN || ph > PH_CRITICO_MAX || temperatura > TEMP_CRITICA_MAX) {
    return 'critico';
  }
  if (ph < PH_ADVERTENCIA_MIN || ph > PH_ADVERTENCIA_MAX || temperatura > TEMP_ADVERTENCIA_MAX) {
    return 'medio';
  }
  return 'estable';
}

@Injectable({
  providedIn: 'root'
})
export class MapaService {

  constructor(
    private recursoService: RecursoService,
    private medicionService: MedicionService
  ) {}

  /** Un punto por recurso con coordenadas, con el estado de su última medición. */
  getPuntos(): Observable<PuntoMapa[]> {
    return forkJoin({
      recursos: this.recursoService.listar(),
      mediciones: this.medicionService.listar(),
    }).pipe(
      map(({ recursos, mediciones }) => this.construirPuntos(recursos || [], mediciones || []))
    );
  }

  private construirPuntos(recursos: Recurso[], mediciones: Medicion[]): PuntoMapa[] {

    // Última medición de cada recurso (por fecha; si empatan, la de mayor id)
    const ultima = new Map<number, Medicion>();
    for (const m of mediciones) {
      const actual = ultima.get(m.idRecurso);
      if (!actual || this.esMasReciente(m, actual)) {
        ultima.set(m.idRecurso, m);
      }
    }

    return recursos
      .filter(r => r.id != null && this.tieneCoordenadas(r))
      .map(r => {
        const m = ultima.get(r.id!);
        return {
          id: r.id!,
          nombre: r.nombre,
          tipo: r.tipo,
          ubicacion: r.ubicacion,
          latitud: r.latitud,
          longitud: r.longitud,
          estado: m ? calcularEstado(m.ph, m.temperatura) : 'sin-datos',
          ph: m?.ph,
          temperatura: m?.temperatura,
          contaminante: m?.nombreContaminante,
          fecha: m?.fecha,
        } as PuntoMapa;
      });
  }

  private esMasReciente(a: Medicion, b: Medicion): boolean {
    const fa = a.fecha ?? '';
    const fb = b.fecha ?? '';
    if (fa !== fb) return fa > fb;
    return (a.id ?? 0) > (b.id ?? 0);
  }

  private tieneCoordenadas(r: Recurso): boolean {
    return Number.isFinite(r.latitud) && Number.isFinite(r.longitud)
      && !(r.latitud === 0 && r.longitud === 0);
  }
}
