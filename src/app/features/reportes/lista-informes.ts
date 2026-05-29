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
    ph:                { min: 6.5,  max: 8.5  },
    temperatura:       { min: 0,    max: 25.0  },
    oxigenoDisuelto:   { min: 5.0,  max: 999   },
    conductividad:     { min: 0,    max: 1000  },
    turbidez:          { min: 0,    max: 4     },
    nitratos:          { min: 0,    max: 50    },
    coliformesFecales: { min: 0,    max: 200   },
    dbo5:              { min: 0,    max: 5     },
    metalesPesados:    { min: 0,    max: 0.3   },
  };

  constructor(
    private informeService: InformeService,
    private recursoService: RecursoService,
    private contaminanteService: ContaminanteService,
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
  }

  // ─────────────────────────────────────────────────────────────
  // CARGA DE DATOS
  // ─────────────────────────────────────────────────────────────

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
        console.error('Error al cargar informes:', err);
        this.error = 'Error al cargar informes';
        this.cargando = false;
      },
    });
  }

  private _cargarDetalle(id: number): void {
    this.cargandoDetalle = true;
    this.informeDetalle = null;

    this.informeService.buscarPorId(id).subscribe({
      next: (data) => {
        console.log('Detalle recibido:', data);
        console.log('Estadísticas:', (data as any).estadisticas);

        this.informeDetalle = data;
        this.cargandoDetalle = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle:', err);
        this.cargandoDetalle = false;
      },
    });
  }

  onCambiarInforme(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);

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

  cargarRecursos(): void {
    this.recursoService.listar().subscribe({
      next: (data) => {
        this.recursos = data;
      },
      error: () => {},
    });
  }

  cargarContaminantes(): void {
    this.contaminanteService.listar().subscribe({
      next: (data) => {
        this.contaminantes = data;
      },
      error: () => {},
    });
  }

  // ─────────────────────────────────────────────────────────────
  // FORMULARIO
  // ─────────────────────────────────────────────────────────────

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

  private _toDatetimeLocal(valor: any): string {
    if (!valor) return '';

    if (Array.isArray(valor)) {
      const [y, mo, d, h = 0, mi = 0] = valor;

      const pad = (n: number) => String(n).padStart(2, '0');

      return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`;
    }

    return String(valor).slice(0, 16);
  }

  private formatearFecha(valor: string): string {
    const d = new Date(valor);

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  }

  guardar(): void {
    this.errorModal = '';

    if (!this.form.titulo?.trim()) {
      this.errorModal = 'El título es obligatorio';
      return;
    }

    if (!this.form.recursoId || this.form.recursoId <= 0) {
      this.errorModal = 'Debes seleccionar un recurso';
      return;
    }

    if (!this.form.contaminanteId || this.form.contaminanteId <= 0) {
      this.errorModal = 'Debes seleccionar un contaminante';
      return;
    }

    if (!this.form.fechaInicio || !this.form.fechaFin) {
      this.errorModal = 'Debes seleccionar el rango de fechas';
      return;
    }

    if (new Date(this.form.fechaInicio) >= new Date(this.form.fechaFin)) {
      this.errorModal = 'La fecha inicio debe ser anterior a la fecha fin';
      return;
    }

    const payload: Informe = {
      ...this.form,
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion ?? '',
      recursoId: Number(this.form.recursoId),
      contaminanteId: Number(this.form.contaminanteId),
      fechaInicio: this.formatearFecha(this.form.fechaInicio),
      fechaFin: this.formatearFecha(this.form.fechaFin),
    };

    const operacion =
      this.modoEdicion && this.form.id
        ? this.informeService.actualizar(this.form.id, payload)
        : this.informeService.crear(payload);

    operacion.subscribe({
      next: (respuesta) => {
        this.cerrarFormulario();
        this.cargar();

        if (respuesta.id != null) {
          this.informeSeleccionadoId = respuesta.id!;
          this._cargarDetalle(respuesta.id!);
        }
      },
      error: (err) => {
        this.errorModal =
          err.error?.message ||
          `Error al ${this.modoEdicion ? 'actualizar' : 'crear'} el informe`;
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

  // ─────────────────────────────────────────────────────────────
  // FECHAS
  // ─────────────────────────────────────────────────────────────

  private _parseDate(valor: any): Date | null {
    if (!valor) return null;

    if (Array.isArray(valor)) {
      const [y, mo, d, h = 0, mi = 0, s = 0] = valor;
      return new Date(y, mo - 1, d, h, mi, s);
    }

    const dt = new Date(valor);

    return isNaN(dt.getTime()) ? null : dt;
  }

  private _fmt(v: any): string {
    const d = this._parseDate(v);

    if (!d) return '—';

    const p = (n: number) => String(n).padStart(2, '0');

    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  private _fmtD(v: any): string {
    const d = this._parseDate(v);

    if (!d) return '—';

    const p = (n: number) => String(n).padStart(2, '0');

    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  get informeDetalleFechas(): {
    inicio: Date | null;
    fin: Date | null;
    generacion: Date | null;
  } {
    if (!this.informeDetalle) {
      return {
        inicio: null,
        fin: null,
        generacion: null,
      };
    }

    const inf = this.informeDetalle as any;

    return {
      inicio: this._parseDate(inf.fechaInicio),
      fin: this._parseDate(inf.fechaFin),
      generacion: this._parseDate(inf.fechaGeneracion),
    };
  }

  // ─────────────────────────────────────────────────────────────
  // CALIDAD DEL AGUA
  // ─────────────────────────────────────────────────────────────

  nivelParametro(
    valor: number | undefined,
    min: number,
    max: number
  ): NivelCalidad {

    if (valor === undefined || valor === null) return 'ok';

    if (valor < min || valor > max) return 'danger';

    const margen = (max - min) * 0.15;

    if (valor > max - margen || valor < min + margen) {
      return 'warn';
    }

    return 'ok';
  }

  barraProgreso(valor: number | undefined, max: number): number {
    if (!valor) return 0;

    return Math.min(
      100,
      Math.round((valor / (max * 1.5)) * 100)
    );
  }

  barraClase(nivel: NivelCalidad): string {
    return {
      ok: 'bar-ok',
      warn: 'bar-warn',
      danger: 'bar-danger',
    }[nivel];
  }

  statusPillClase(nivel: NivelCalidad): string {
    return {
      ok: 'pill-ok',
      warn: 'pill-warn',
      danger: 'pill-danger',
    }[nivel];
  }

  statusPillLabel(
    nivel: NivelCalidad,
    param: string
  ): string {

    if (nivel === 'ok') return 'Normal';

    if (nivel === 'warn') return 'Elevado';

    if (param === 'ph' && nivel === 'danger') {
      return 'Fuera de rango';
    }

    return 'Crítico';
  }

  get parametrosCalidad(): ParametroCalidad[] {

    const s = this.estadisticas;

    if (!s) return [];

    const params: ParametroCalidad[] = [
      {
        nombre: 'pH del agua',
        unidad: 'pH',
        valor: s.promedioPh,
        minOk: this.UMBRALES.ph.min,
        maxOk: this.UMBRALES.ph.max,
        descripcionLimite:
          `Rango OMS: ${this.UMBRALES.ph.min} – ${this.UMBRALES.ph.max}`,
      },

      {
        nombre: 'Temperatura',
        unidad: '°C',
        valor: s.promedioTemperatura,
        minOk: this.UMBRALES.temperatura.min,
        maxOk: this.UMBRALES.temperatura.max,
        descripcionLimite:
          `Máx. vida acuática: ${this.UMBRALES.temperatura.max}°C`,
      },
    ];

    if (s.oxigenoDisuelto != null) {
      params.push({
        nombre: 'Oxígeno disuelto',
        unidad: 'mg/L',
        valor: s.oxigenoDisuelto,
        minOk: this.UMBRALES.oxigenoDisuelto.min,
        maxOk: this.UMBRALES.oxigenoDisuelto.max,
        descripcionLimite:
          `Mínimo EPA: ${this.UMBRALES.oxigenoDisuelto.min} mg/L`,
      });
    }

    if (s.conductividad != null) {
      params.push({
        nombre: 'Conductividad eléctrica',
        unidad: 'µS/cm',
        valor: s.conductividad,
        minOk: 0,
        maxOk: this.UMBRALES.conductividad.max,
        descripcionLimite:
          `Límite OMS: ${this.UMBRALES.conductividad.max} µS/cm`,
      });
    }

    if (s.turbidez != null) {
      params.push({
        nombre: 'Turbidez',
        unidad: 'NTU',
        valor: s.turbidez,
        minOk: 0,
        maxOk: this.UMBRALES.turbidez.max,
        descripcionLimite:
          `Límite OMS: ${this.UMBRALES.turbidez.max} NTU`,
      });
    }

    if (s.nitratos != null) {
      params.push({
        nombre: 'Nitratos (NO₃⁻)',
        unidad: 'mg/L',
        valor: s.nitratos,
        minOk: 0,
        maxOk: this.UMBRALES.nitratos.max,
        descripcionLimite:
          `Límite OMS: ${this.UMBRALES.nitratos.max} mg/L`,
      });
    }

    if (s.coliformesFecales != null) {
      params.push({
        nombre: 'Coliformes fecales',
        unidad: 'UFC/100mL',
        valor: s.coliformesFecales,
        minOk: 0,
        maxOk: this.UMBRALES.coliformesFecales.max,
        descripcionLimite:
          `Límite EPA: ${this.UMBRALES.coliformesFecales.max} UFC/100mL`,
      });
    }

    if (s.dbo5 != null) {
      params.push({
        nombre: 'DBO₅',
        unidad: 'mg/L',
        valor: s.dbo5,
        minOk: 0,
        maxOk: this.UMBRALES.dbo5.max,
        descripcionLimite:
          `Clase II EPA: < ${this.UMBRALES.dbo5.max} mg/L`,
      });
    }

    if (s.metalesPesados != null) {
      params.push({
        nombre: 'Metales pesados',
        unidad: 'mg/L',
        valor: s.metalesPesados,
        minOk: 0,
        maxOk: this.UMBRALES.metalesPesados.max,
        descripcionLimite:
          `Referencia EPA: < ${this.UMBRALES.metalesPesados.max} mg/L`,
      });
    }

    return params;
  }

  nivelDeParametro(p: ParametroCalidad): NivelCalidad {
    return this.nivelParametro(
      p.valor,
      p.minOk ?? 0,
      p.maxOk
    );
  }

  get scoreCalidad(): ScoreCalidad | null {

    const params = this.parametrosCalidad;

    if (!params.length) return null;

    const niveles = params.map((p) => this.nivelDeParametro(p));

    const ok = niveles.filter((n) => n === 'ok').length;
    const warn = niveles.filter((n) => n === 'warn').length;
    const danger = niveles.filter((n) => n === 'danger').length;

    const score = Math.round(
      (ok * 100 + warn * 60) / params.length
    );

    let clasificacion: ScoreCalidad['clasificacion'];
    let descripcion: string;

    if (score >= 90) {
      clasificacion = 'Excelente';
      descripcion =
        'Todos los parámetros dentro de los rangos OMS/EPA.';
    }
    else if (score >= 75) {
      clasificacion = 'Buena';
      descripcion =
        'La mayoría de parámetros en rango normal.';
    }
    else if (score >= 55) {
      clasificacion = 'Regular';
      descripcion =
        'Varios parámetros en alerta.';
    }
    else if (score >= 30) {
      clasificacion = 'Mala';
      descripcion =
        'Múltiples parámetros fuera de rango.';
    }
    else {
      clasificacion = 'Crítica';
      descripcion =
        'Niveles críticos de contaminación.';
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

    const map: Record<string, string> = {
      Excelente: 'sc-excelente',
      Buena: 'sc-buena',
      Regular: 'sc-regular',
      Mala: 'sc-mala',
      Crítica: 'sc-critica',
    };

    return map[clasificacion] ?? 'sc-regular';
  }

  // ─────────────────────────────────────────────────────────────
  // ALERTAS
  // ─────────────────────────────────────────────────────────────

  nivelAlertaClase(nivel: string): string {

    switch (nivel?.toUpperCase()) {

      case 'ALTA':
      case 'ROJA':
        return 'nivel-alta';

      case 'MEDIA':
      case 'NARANJA':
        return 'nivel-media';

      case 'AMARILLA':
        return 'nivel-amarilla';

      default:
        return 'nivel-baja';
    }
  }

  nivelTagClase(nivel: string): string {

    switch (nivel?.toUpperCase()) {

      case 'ALTA':
      case 'ROJA':
        return 'tag-alta';

      case 'MEDIA':
      case 'NARANJA':
        return 'tag-media';

      case 'AMARILLA':
        return 'tag-amarilla';

      default:
        return 'tag-baja';
    }
  }

  nivelDotClase(nivel: string): string {

    switch (nivel?.toUpperCase()) {

      case 'ALTA':
      case 'ROJA':
        return 'dot-alta';

      case 'MEDIA':
      case 'NARANJA':
        return 'dot-media';

      case 'AMARILLA':
        return 'dot-amarilla';

      default:
        return 'dot-baja';
    }
  }

  nivelIcono(nivel: string): string {

    switch (nivel?.toUpperCase()) {

      case 'ALTA':
      case 'ROJA':
        return 'ti-alert-octagon';

      case 'MEDIA':
      case 'NARANJA':
        return 'ti-alert-triangle';

      case 'AMARILLA':
        return 'ti-alert-triangle';

      default:
        return 'ti-info-circle';
    }
  }

  nivelIconoColor(nivel: string): string {

    switch (nivel?.toUpperCase()) {

      case 'ALTA':
      case 'ROJA':
        return '#E24B4A';

      case 'MEDIA':
      case 'NARANJA':
        return '#EF9F27';

      case 'AMARILLA':
        return '#BA7517';

      default:
        return '#639922';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DISTRIBUCIÓN ALERTAS
  // ─────────────────────────────────────────────────────────────

  get distribucionAlertas():
    {
      nivel: string;
      cantidad: number;
      porcentaje: number;
      color: string;
    }[] {

    const map = this.estadisticas?.alertasPorNivel ?? {};

    const total = Object.values(map)
      .reduce((a, b) => a + b, 0);

    if (!total) return [];

    const colorMap: Record<string, string> = {
      ALTA: '#E24B4A',
      ROJA: '#E24B4A',
      MEDIA: '#EF9F27',
      NARANJA: '#EF9F27',
      AMARILLA: '#BA7517',
      BAJA: '#639922',
      VERDE: '#639922',
    };

    return Object.entries(map)
      .map(([nivel, cantidad]) => ({
        nivel,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
        color:
          colorMap[nivel.toUpperCase()] ?? '#888780',
      }))
      .sort((a, b) => {

        const order: Record<string, number> = {
          ALTA: 0,
          ROJA: 0,
          MEDIA: 1,
          NARANJA: 1,
          AMARILLA: 2,
          BAJA: 3,
          VERDE: 3,
        };

        return (
          (order[a.nivel.toUpperCase()] ?? 4) -
          (order[b.nivel.toUpperCase()] ?? 4)
        );
      });
  }

  // ─────────────────────────────────────────────────────────────
  // GAUGE
  // ─────────────────────────────────────────────────────────────

  gaugeOffset(
    valor: number | undefined,
    min: number,
    max: number
  ): number {

    if (valor === undefined || valor === null) {
      return 157;
    }

    const pct = Math.min(
      1,
      Math.max(0, valor / (max * 1.2))
    );

    return Math.round(157 - pct * 157);
  }

  gaugeColor(nivel: NivelCalidad): string {
    return {
      ok: '#639922',
      warn: '#EF9F27',
      danger: '#E24B4A',
    }[nivel];
  }

  // ─────────────────────────────────────────────────────────────
  // UTILIDADES
  // ─────────────────────────────────────────────────────────────

  get estadisticas(): Estadisticas | null {

    const d = this.informeDetalle as any;

    if (!d) return null;

    const raw: Estadisticas =
      d.estadisticas ??
      d.stats ??
      d.data ??
      null;

    if (!raw) return null;

    if (raw.alertas) {
      raw.alertas = raw.alertas.map((a: any) => ({
        ...a,
        fecha:
          this._parseDate(a.fecha)?.toISOString() ??
          a.fecha,
      }));
    }

    if (raw.eventos) {
      raw.eventos = raw.eventos.map((e: any) => ({
        ...e,
        fecha:
          this._parseDate(e.fecha)?.toISOString() ??
          e.fecha,
      }));
    }

    return raw;
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

  // ─────────────────────────────────────────────────────────────
  // EXPORTAR PDF
  // ─────────────────────────────────────────────────────────────

  exportarPDF(): void {

    const id =
      this.informeSeleccionadoId ??
      (this.informes.length > 0
        ? this.informes[0].id
        : null);

    if (!id) {
      alert('No hay informes disponibles para exportar');
      return;
    }

    if (
      this.informeDetalle &&
      (this.informeDetalle as any).id === id
    ) {
      this._generarPDF();
      return;
    }

    this.informeService.buscarPorId(id).subscribe({
      next: (data) => {
        this.informeDetalle = data;
        this._generarPDF();
      },
      error: () => {
        alert('Error al cargar el informe para PDF');
      },
    });
  }

  private _generarPDF(): void {

    const inf = this.informeDetalle!;

    const html = `
      <html>
        <head>
          <title>${inf.titulo}</title>
        </head>

        <body style="font-family:Arial;padding:40px">
          <h1>${inf.titulo}</h1>

          <p>
            ${inf.descripcion ?? 'Informe AquaBalance'}
          </p>

          <hr>

          <h3>Información</h3>

          <p>
            <strong>Recurso:</strong>
            ${inf.nombreRecurso ?? '—'}
          </p>

          <p>
            <strong>Contaminante:</strong>
            ${inf.nombreContaminante ?? '—'}
          </p>

          <p>
            <strong>Fecha inicio:</strong>
            ${this._fmtD((inf as any).fechaInicio)}
          </p>

          <p>
            <strong>Fecha fin:</strong>
            ${this._fmtD((inf as any).fechaFin)}
          </p>

          <hr>

          <h3>Generado por AquaBalance</h3>
        </body>
      </html>
    `;

    const ventana = window.open('', '_blank');

    if (!ventana) {
      alert(
        'El navegador bloqueó la ventana emergente.'
      );
      return;
    }

    ventana.document.write(html);
    ventana.document.close();

    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 800);
  }
}
