import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InformeService } from '../../core/services/informe.service';

import {
  Informe,
  Estadisticas,
  ParametroCalidad,
  NivelCalidad,
  ScoreCalidad,
} from '../../core/models/informe.model';

@Component({
  selector: 'app-lista-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-informes.html',
  styleUrl: './lista-informes.css',
})
export class ListaInformesComponent implements OnInit {

  informes: Informe[] = [];

  cargando = false;
  cargandoDetalle = false;

  error = '';

  vistaActual: 'informes' | 'estadisticas' = 'informes';

  informeSeleccionadoId: number | null = null;
  informeDetalle: Informe | null = null;

  private readonly UMBRALES = {
    ph: { min: 6.5, max: 8.5 },
    temperatura: { min: 0, max: 25 },
    oxigenoDisuelto: { min: 5, max: 999 },
    conductividad: { min: 0, max: 1000 },
    turbidez: { min: 0, max: 4 },
    nitratos: { min: 0, max: 50 },
    coliformesFecales: { min: 0, max: 200 },
    dbo5: { min: 0, max: 5 },
    metalesPesados: { min: 0, max: 0.3 },
  };

  constructor(
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  // ==========================
  // CARGAR DATOS
  // ==========================

  cargar(): void {

    this.cargando = true;
    this.error = '';

    this.informeService.listar().subscribe({

      next: (data) => {

        this.informes = data || [];

        this.cargando = false;

        if (this.informes.length > 0) {

          const primero = this.informes[0];

          if (primero.id != null) {

            this.informeSeleccionadoId = primero.id;

            this._cargarDetalle(primero.id);
          }
        }
      },

      error: () => {

        this.error = 'Error al cargar informes';

        this.cargando = false;
      },
    });
  }

  private _cargarDetalle(id: number): void {

    this.cargandoDetalle = true;

    this.informeService.buscarPorId(id).subscribe({

      next: (data) => {

        this.informeDetalle = data;

        this.cargandoDetalle = false;
      },

      error: () => {

        this.cargandoDetalle = false;
      },
    });
  }

  onCambiarInforme(event: Event): void {

    const id = Number(
      (event.target as HTMLSelectElement).value
    );

    if (id > 0) {

      this.informeSeleccionadoId = id;

      this._cargarDetalle(id);
    }
  }

  verEstadisticas(id: number): void {

    this.vistaActual = 'estadisticas';

    this.informeSeleccionadoId = id;

    this._cargarDetalle(id);
  }

  // ==========================
  // ESTADÍSTICAS
  // ==========================

  get estadisticas(): Estadisticas | null {

    const detalle: any = this.informeDetalle;

    if (!detalle) return null;

    return detalle.estadisticas ?? null;
  }

  objetoAArray(
    obj: { [key: string]: number } | undefined
  ): { clave: string; valor: number }[] {

    if (!obj) return [];

    return Object.entries(obj).map(
      ([clave, valor]) => ({
        clave,
        valor,
      })
    );
  }

  // ==========================
  // CALIDAD AGUA
  // ==========================

  nivelParametro(
    valor: number | undefined,
    min: number,
    max: number
  ): NivelCalidad {

    if (valor == null) return 'ok';

    if (valor < min || valor > max) {
      return 'danger';
    }

    const margen = (max - min) * 0.15;

    if (
      valor > max - margen ||
      valor < min + margen
    ) {
      return 'warn';
    }

    return 'ok';
  }

  get parametrosCalidad(): ParametroCalidad[] {

    const s = this.estadisticas;

    if (!s) return [];

    const params: ParametroCalidad[] = [];

    params.push({
      nombre: 'pH',
      unidad: 'pH',
      valor: s.promedioPh,
      minOk: this.UMBRALES.ph.min,
      maxOk: this.UMBRALES.ph.max,
      descripcionLimite: 'OMS: 6.5 - 8.5',
    });

    params.push({
      nombre: 'Temperatura',
      unidad: '°C',
      valor: s.promedioTemperatura,
      minOk: this.UMBRALES.temperatura.min,
      maxOk: this.UMBRALES.temperatura.max,
      descripcionLimite: 'Máx. 25°C',
    });

    return params;
  }

  nivelDeParametro(
    p: ParametroCalidad
  ): NivelCalidad {

    return this.nivelParametro(
      p.valor,
      p.minOk ?? 0,
      p.maxOk
    );
  }

  barraClase(nivel: NivelCalidad): string {

    return {
      ok: 'bar-ok',
      warn: 'bar-warn',
      danger: 'bar-danger',
    }[nivel];
  }

  barraProgreso(
    valor: number | undefined,
    max: number
  ): number {

    if (!valor) return 0;

    return Math.min(
      100,
      Math.round((valor / (max * 1.5)) * 100)
    );
  }

  statusPillClase(nivel: NivelCalidad): string {

    return {
      ok: 'pill-ok',
      warn: 'pill-warn',
      danger: 'pill-danger',
    }[nivel];
  }

  statusPillLabel(nivel: NivelCalidad): string {

    if (nivel === 'ok') return 'Normal';

    if (nivel === 'warn') return 'Elevado';

    return 'Crítico';
  }

  // ==========================
  // SCORE
  // ==========================

  get scoreCalidad(): ScoreCalidad | null {

    const params = this.parametrosCalidad;

    if (!params.length) return null;

    const niveles = params.map(
      (p) => this.nivelDeParametro(p)
    );

    const ok = niveles.filter(
      (n) => n === 'ok'
    ).length;

    const warn = niveles.filter(
      (n) => n === 'warn'
    ).length;

    const danger = niveles.filter(
      (n) => n === 'danger'
    ).length;

    const score = Math.round(
      (ok * 100 + warn * 60) /
      params.length
    );

    let clasificacion:
      | 'Excelente'
      | 'Buena'
      | 'Regular'
      | 'Mala'
      | 'Crítica';

    let descripcion = '';

    if (score >= 90) {

      clasificacion = 'Excelente';

      descripcion =
        'Todos los parámetros están normales.';
    }

    else if (score >= 75) {

      clasificacion = 'Buena';

      descripcion =
        'La mayoría de parámetros están correctos.';
    }

    else if (score >= 55) {

      clasificacion = 'Regular';

      descripcion =
        'Existen parámetros en alerta.';
    }

    else if (score >= 30) {

      clasificacion = 'Mala';

      descripcion =
        'Hay contaminación considerable.';
    }

    else {

      clasificacion = 'Crítica';

      descripcion =
        'La calidad del agua es peligrosa.';
    }

    return {
      score,
      clasificacion,
      descripcion,
      parametrosOk: ok,
      parametrosWarn: warn,
      parametrosDanger: danger,
    };
  }

  scoreCircleClase(clasificacion: string): string {

    const clases: Record<string, string> = {

      Excelente: 'sc-excelente',
      Buena: 'sc-buena',
      Regular: 'sc-regular',
      Mala: 'sc-mala',
      Crítica: 'sc-critica',
    };

    return clases[clasificacion] ?? '';
  }

  // ==========================
  // PDF
  // ==========================

  exportarPDF(): void {

    window.print();
  }
}
