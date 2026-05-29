import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InformeService } from '../../core/services/informe.service';
import { RecursoService } from '../../core/services/recurso.service';
import { ContaminanteService } from '../../core/services/contaminante.service';
import { AuthService } from '../../core/services/auth.service';

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
  recursos: any[] = [];
  contaminantes: any[] = [];

  cargando = false;
  cargandoDetalle = false;

  error = '';
  errorModal = '';

  mostrarFormulario = false;
  modoEdicion = false;

  vistaActual: 'informes' | 'estadisticas' = 'informes';

  informeSeleccionadoId: number | null = null;
  informeDetalle: Informe | null = null;

  form: Informe = this.formVacio();

  private readonly UMBRALES = {
    ph:                { min: 6.5, max: 8.5 },
    temperatura:       { min: 0, max: 25 },
    oxigenoDisuelto:   { min: 5, max: 999 },
    conductividad:     { min: 0, max: 1000 },
    turbidez:          { min: 0, max: 4 },
    nitratos:          { min: 0, max: 50 },
    coliformesFecales: { min: 0, max: 200 },
    dbo5:              { min: 0, max: 5 },
    metalesPesados:    { min: 0, max: 0.3 },
  };

  constructor(
    private informeService: InformeService,
    private recursoService: RecursoService,
    private contaminanteService: ContaminanteService,

    // ✅ IMPORTANTE
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
  }

  // =========================================================
  // CARGAR DATOS
  // =========================================================

  cargar(): void {

    this.cargando = true;
    this.error = '';

    this.informeService.listar().subscribe({

      next: (data) => {

        this.informes = data;
        this.cargando = false;

        if (data.length > 0 && data[0].id != null) {

          this.informeSeleccionadoId = data[0].id!;

          this._cargarDetalle(data[0].id!);
        }
      },

      error: (err) => {

        console.error(err);

        this.error = 'Error al cargar informes';
        this.cargando = false;
      }

    });
  }

  cargarRecursos(): void {

    this.recursoService.listar().subscribe({

      next: (data) => {
        this.recursos = data;
      },

      error: () => {}

    });
  }

  cargarContaminantes(): void {

    this.contaminanteService.listar().subscribe({

      next: (data) => {
        this.contaminantes = data;
      },

      error: () => {}

    });
  }

  // =========================================================
  // DETALLE
  // =========================================================

  private _cargarDetalle(id: number): void {

    this.cargandoDetalle = true;

    this.informeService.buscarPorId(id).subscribe({

      next: (data) => {

        this.informeDetalle = data;
        this.cargandoDetalle = false;
      },

      error: () => {
        this.cargandoDetalle = false;
      }

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

    this.informeSeleccionadoId = id;

    this.vistaActual = 'estadisticas';

    this._cargarDetalle(id);
  }

  // =========================================================
  // FORMULARIO
  // =========================================================

  abrirFormulario(): void {

    // ❌ BLOQUEAR USUARIO PUBLICO
    if (this.authService.isPublico()) {
      return;
    }

    this.form = this.formVacio();

    this.modoEdicion = false;

    this.errorModal = '';

    this.mostrarFormulario = true;
  }

  abrirEdicion(informe: Informe): void {

    // ❌ BLOQUEAR USUARIO PUBLICO
    if (this.authService.isPublico()) {
      return;
    }

    this.form = {
      id: informe.id,
      titulo: informe.titulo,
      descripcion: informe.descripcion ?? '',
      recursoId: informe.recursoId,
      contaminanteId: informe.contaminanteId,
      fechaInicio: this._toDatetimeLocal((informe as any).fechaInicio),
      fechaFin: this._toDatetimeLocal((informe as any).fechaFin),
    };

    this.modoEdicion = true;

    this.errorModal = '';

    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.modoEdicion = false;

    this.form = this.formVacio();

    this.errorModal = '';
  }

  guardar(): void {

    // ❌ BLOQUEAR USUARIO PUBLICO
    if (this.authService.isPublico()) {
      return;
    }

    this.errorModal = '';

    if (!this.form.titulo?.trim()) {
      this.errorModal = 'El título es obligatorio';
      return;
    }

    if (!this.form.recursoId || this.form.recursoId <= 0) {
      this.errorModal = 'Selecciona un recurso';
      return;
    }

    if (!this.form.contaminanteId || this.form.contaminanteId <= 0) {
      this.errorModal = 'Selecciona un contaminante';
      return;
    }

    const payload: Informe = {
      ...this.form,
      titulo: this.form.titulo.trim(),
    };

    const operacion = this.modoEdicion && this.form.id
      ? this.informeService.actualizar(this.form.id, payload)
      : this.informeService.crear(payload);

    operacion.subscribe({

      next: () => {

        this.cerrarFormulario();

        this.cargar();
      },

      error: () => {

        this.errorModal = 'Error al guardar';
      }

    });
  }

  eliminar(id: number): void {

    // ❌ BLOQUEAR USUARIO PUBLICO
    if (this.authService.isPublico()) {
      return;
    }

    if (!confirm('¿Eliminar este informe?')) {
      return;
    }

    this.informeService.eliminar(id).subscribe({

      next: () => {

        this.cargar();

        this.informeDetalle = null;
      },

      error: () => {

        this.error = 'Error al eliminar';
      }

    });
  }

  // =========================================================
  // FECHAS
  // =========================================================

  private _toDatetimeLocal(valor: any): string {

    if (!valor) return '';

    const d = new Date(valor);

    return d.toISOString().slice(0, 16);
  }

  // =========================================================
  // ESTADISTICAS
  // =========================================================

  get estadisticas(): Estadisticas | null {

    const d = this.informeDetalle as any;

    if (!d) return null;

    return d.estadisticas ?? null;
  }

  // =========================================================
  // PARAMETROS CALIDAD
  // =========================================================

  nivelParametro(
    valor: number | undefined,
    min: number,
    max: number
  ): NivelCalidad {

    if (valor === undefined || valor === null) {
      return 'ok';
    }

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

    return [

      {
        nombre: 'pH del agua',
        unidad: 'pH',
        valor: s.promedioPh,
        minOk: this.UMBRALES.ph.min,
        maxOk: this.UMBRALES.ph.max,
        descripcionLimite: 'Rango OMS',
      },

      {
        nombre: 'Temperatura',
        unidad: '°C',
        valor: s.promedioTemperatura,
        minOk: this.UMBRALES.temperatura.min,
        maxOk: this.UMBRALES.temperatura.max,
        descripcionLimite: 'Temperatura ideal',
      }

    ];
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

  // =========================================================
  // SCORE
  // =========================================================

  get scoreCalidad(): ScoreCalidad | null {

    const params = this.parametrosCalidad;

    if (!params.length) return null;

    const niveles = params.map(
      p => this.nivelDeParametro(p)
    );

    const ok = niveles.filter(n => n === 'ok').length;

    const warn = niveles.filter(n => n === 'warn').length;

    const danger = niveles.filter(n => n === 'danger').length;

    const score = Math.round(
      (ok * 100 + warn * 60) / params.length
    );

    return {
      score,
      clasificacion: 'Buena',
      descripcion: 'Calidad aceptable',
      parametrosOk: ok,
      parametrosWarn: warn,
      parametrosDanger: danger
    };
  }

  // =========================================================
  // HELPERS
  // =========================================================

  objetoAArray(
    obj: { [key: string]: number } | undefined
  ): { clave: string; valor: number }[] {

    if (!obj) return [];

    return Object.entries(obj).map(
      ([clave, valor]) => ({
        clave,
        valor
      })
    );
  }

  formVacio(): Informe {

    return {
      titulo: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      recursoId: 0,
      contaminanteId: 0
    };
  }

  // =========================================================
  // PDF
  // =========================================================

  exportarPDF(): void {

    window.print();
  }

  // =========================================================
  // CSS HELPERS
  // =========================================================

  barraClase(nivel: NivelCalidad): string {

    return {
      ok: 'bar-ok',
      warn: 'bar-warn',
      danger: 'bar-danger'
    }[nivel];
  }

  statusPillClase(nivel: NivelCalidad): string {

    return {
      ok: 'pill-ok',
      warn: 'pill-warn',
      danger: 'pill-danger'
    }[nivel];
  }

  statusPillLabel(
    nivel: NivelCalidad,
    param: string
  ): string {

    if (nivel === 'ok') return 'Normal';

    if (nivel === 'warn') return 'Elevado';

    return 'Crítico';
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

  scoreCircleClase(
    clasificacion: string
  ): string {

    const map: Record<string, string> = {
      Excelente: 'sc-excelente',
      Buena: 'sc-buena',
      Regular: 'sc-regular',
      Mala: 'sc-mala',
      Crítica: 'sc-critica',
    };

    return map[clasificacion] ?? 'sc-regular';
  }

  // =========================================================
  // FECHAS TEMPLATE
  // =========================================================

  get informeDetalleFechas() {

    if (!this.informeDetalle) {

      return {
        inicio: null,
        fin: null,
      };
    }

    const inf = this.informeDetalle as any;

    return {

      inicio: new Date(inf.fechaInicio),

      fin: new Date(inf.fechaFin),
    };
  }

}
