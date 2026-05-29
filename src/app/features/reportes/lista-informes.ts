import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InformeService } from '../../core/services/informe.service';
import { RecursoService } from '../../core/services/recurso.service';
import { ContaminanteService } from '../../core/services/contaminante.service';

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
    private informeService: InformeService,
    private recursoService: RecursoService,
    private contaminanteService: ContaminanteService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
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

  cargarRecursos(): void {
    this.recursoService.listar().subscribe({
      next: (data) => {
        this.recursos = data || [];
      },
      error: () => {},
    });
  }

  cargarContaminantes(): void {
    this.contaminanteService.listar().subscribe({
      next: (data) => {
        this.contaminantes = data || [];
      },
      error: () => {},
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
  // FORMULARIO
  // ==========================

  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.errorModal = '';
    this.mostrarFormulario = true;
  }

  abrirEdicion(informe: Informe): void {
    this.form = {
      id: informe.id,
      titulo: informe.titulo,
      descripcion: informe.descripcion ?? '',
      recursoId: informe.recursoId,
      contaminanteId: informe.contaminanteId,
      fechaInicio: this._toDatetimeLocal(informe.fechaInicio),
      fechaFin: this._toDatetimeLocal(informe.fechaFin),
    };

    this.modoEdicion = true;
    this.errorModal = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.errorModal = '';
    this.form = this.formVacio();
  }

  guardar(): void {

    this.errorModal = '';

    // VALIDACIONES

    if (!this.form.titulo?.trim()) {
      this.errorModal = 'El título es obligatorio';
      return;
    }

    if (!this.form.recursoId || this.form.recursoId <= 0) {
      this.errorModal = 'Selecciona un recurso';
      return;
    }

    if (
      !this.form.contaminanteId ||
      this.form.contaminanteId <= 0
    ) {
      this.errorModal = 'Selecciona un contaminante';
      return;
    }

    if (!this.form.fechaInicio || !this.form.fechaFin) {
      this.errorModal = 'Debes seleccionar las fechas';
      return;
    }

    if (
      new Date(this.form.fechaInicio) >=
      new Date(this.form.fechaFin)
    ) {
      this.errorModal =
        'La fecha inicio debe ser menor';
      return;
    }

    const payload: Informe = {
      ...this.form,

      titulo: this.form.titulo.trim(),

      descripcion:
        this.form.descripcion?.trim() ?? '',

      recursoId: Number(this.form.recursoId),

      contaminanteId: Number(
        this.form.contaminanteId
      ),

      fechaInicio: this.formatearFecha(
        this.form.fechaInicio
      ),

      fechaFin: this.formatearFecha(
        this.form.fechaFin
      ),
    };

    const peticion =
      this.modoEdicion && this.form.id
        ? this.informeService.actualizar(
            this.form.id,
            payload
          )
        : this.informeService.crear(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.cerrarFormulario();
        this.cargar();

        if (respuesta.id != null) {
          this.informeSeleccionadoId = respuesta.id;
          this._cargarDetalle(respuesta.id);
        }
      },

      error: () => {
        this.errorModal =
          this.modoEdicion
            ? 'Error al actualizar informe'
            : 'Error al crear informe';
      },
    });
  }

  eliminar(id: number): void {

    if (confirm('¿Eliminar este informe?')) {

      this.informeService.eliminar(id).subscribe({

        next: () => {
          this.informeDetalle = null;
          this.informeSeleccionadoId = null;
          this.vistaActual = 'informes';

          this.cargar();
        },

        error: () => {
          this.error = 'Error al eliminar';
        },
      });
    }
  }

  // ==========================
  // FECHAS
  // ==========================

  private _toDatetimeLocal(valor: any): string {

    if (!valor) return '';

    const fecha = new Date(valor);

    const pad = (n: number) =>
      String(n).padStart(2, '0');

    return `${fecha.getFullYear()}-${pad(
      fecha.getMonth() + 1
    )}-${pad(fecha.getDate())}T${pad(
      fecha.getHours()
    )}:${pad(fecha.getMinutes())}`;
  }

  formatearFecha(valor: string): string {

    const d = new Date(valor);

    const pad = (n: number) =>
      String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(
      d.getMonth() + 1
    )}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}:00`;
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
  // SCORE CALIDAD
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

    return [
      {
        nombre: 'pH',
        unidad: 'pH',
        valor: s.promedioPh,
        minOk: this.UMBRALES.ph.min,
        maxOk: this.UMBRALES.ph.max,
        descripcionLimite:
          'OMS: 6.5 - 8.5',
      },

      {
        nombre: 'Temperatura',
        unidad: '°C',
        valor: s.promedioTemperatura,
        minOk: this.UMBRALES.temperatura.min,
        maxOk: this.UMBRALES.temperatura.max,
        descripcionLimite:
          'Máx. 25°C',
      },
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

  get scoreCalidad(): ScoreCalidad | null {

    const params = this.parametrosCalidad;

    if (!params.length) return null;

    const niveles = params.map((p) =>
      this.nivelDeParametro(p)
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
    } else if (score >= 75) {
      clasificacion = 'Buena';
      descripcion =
        'La mayoría de parámetros están correctos.';
    } else if (score >= 55) {
      clasificacion = 'Regular';
      descripcion =
        'Existen parámetros en alerta.';
    } else if (score >= 30) {
      clasificacion = 'Mala';
      descripcion =
        'Hay contaminación considerable.';
    } else {
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
  // FORM VACÍO
  // ==========================

  formVacio(): Informe {

    return {
      titulo: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      recursoId: 0,
      contaminanteId: 0,
    };
  }

  // ==========================
  // PDF
  // ==========================

  exportarPDF(): void {

    window.print();
  }
}
