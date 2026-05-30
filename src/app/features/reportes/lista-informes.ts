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

  // 🔹 CONTROL DE ROL
  isPublico = false;

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
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // 🔹 VERIFICAR ROL
    this.isPublico = this.authService.isPublico();

    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
  }

  // ─── CARGA DE DATOS ───────────────────────────────────────────

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
      next: (data) => { this.recursos = data; },
      error: () => {},
    });
  }

  cargarContaminantes(): void {
    this.contaminanteService.listar().subscribe({
      next: (data) => { this.contaminantes = data; },
      error: () => {},
    });
  }

  // ─── FORMULARIO ──────────────────────────────────────────────

  abrirFormulario(): void {
    if (this.isPublico) return;
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.errorModal = '';
    this.mostrarFormulario = true;
  }

  abrirEdicion(informe: Informe): void {
    if (this.isPublico) return;
    this.form = {
      id: informe.id,
      titulo: informe.titulo,
      descripcion: informe.descripcion ?? '',
      recursoId: informe.recursoId,
      contaminanteId: informe.contaminanteId,
      fechaInicio: this._toDatetimeLocal((informe as any).fechaInicio),
      fechaFin:    this._toDatetimeLocal((informe as any).fechaFin),
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
    if (this.isPublico) return;
    this.errorModal = '';

    if (!this.form.titulo?.trim())                                   { this.errorModal = 'El título es obligatorio'; return; }
    if (!this.form.recursoId || this.form.recursoId <= 0)            { this.errorModal = 'Debes seleccionar un recurso'; return; }
    if (!this.form.contaminanteId || this.form.contaminanteId <= 0)  { this.errorModal = 'Debes seleccionar un contaminante'; return; }
    if (!this.form.fechaInicio || !this.form.fechaFin)               { this.errorModal = 'Debes seleccionar el rango de fechas'; return; }
    if (new Date(this.form.fechaInicio) >= new Date(this.form.fechaFin)) {
      this.errorModal = 'La fecha inicio debe ser anterior a la fecha fin'; return;
    }

    const payload: Informe = {
      ...this.form,
      titulo:         this.form.titulo.trim(),
      descripcion:    this.form.descripcion ?? '',
      recursoId:      Number(this.form.recursoId),
      contaminanteId: Number(this.form.contaminanteId),
      fechaInicio:    this.formatearFecha(this.form.fechaInicio),
      fechaFin:       this.formatearFecha(this.form.fechaFin),
    };

    const operacion = this.modoEdicion && this.form.id
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
        this.errorModal = err.error?.message
          || `Error al ${this.modoEdicion ? 'actualizar' : 'crear'} el informe`;
      },
    });
  }

  eliminar(id: number): void {
    if (this.isPublico) return;
    if (confirm('¿Eliminar este informe?')) {
      this.informeService.eliminar(id).subscribe({
        next: () => {
          this.informeDetalle = null;
          this.informeSeleccionadoId = null;
          this.vistaActual = 'informes';
          this.cargar();
        },
        error: () => { this.error = 'Error al eliminar'; },
      });
    }
  }

  // ─── HELPERS DE FECHA ────────────────────────────────────────

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

  get informeDetalleFechas(): { inicio: Date | null; fin: Date | null; generacion: Date | null } {
    if (!this.informeDetalle) return { inicio: null, fin: null, generacion: null };
    const inf = this.informeDetalle as any;
    return {
      inicio:     this._parseDate(inf.fechaInicio),
      fin:        this._parseDate(inf.fechaFin),
      generacion: this._parseDate(inf.fechaGeneracion),
    };
  }

  // ─── CALIDAD DEL AGUA ────────────────────────────────────────

  nivelParametro(valor: number | undefined, min: number, max: number): NivelCalidad {
    if (valor === undefined || valor === null) return 'ok';
    if (valor < min || valor > max) return 'danger';
    const margen = (max - min) * 0.15;
    if (valor > max - margen || valor < min + margen) return 'warn';
    return 'ok';
  }

  barraProgreso(valor: number | undefined, max: number): number {
    if (!valor) return 0;
    return Math.min(100, Math.round((valor / (max * 1.5)) * 100));
  }

  barraClase(nivel: NivelCalidad): string {
    return { ok: 'bar-ok', warn: 'bar-warn', danger: 'bar-danger' }[nivel];
  }

  statusPillClase(nivel: NivelCalidad): string {
    return { ok: 'pill-ok', warn: 'pill-warn', danger: 'pill-danger' }[nivel];
  }

  statusPillLabel(nivel: NivelCalidad, param: string): string {
    if (nivel === 'ok')   return 'Normal';
    if (nivel === 'warn') return 'Elevado';
    if (param === 'ph' && nivel === 'danger') return 'Fuera de rango';
    return 'Crítico';
  }

  get parametrosCalidad(): ParametroCalidad[] {
    const s = this.estadisticas;
    if (!s) return [];

    const params: ParametroCalidad[] = [
      {
        nombre: 'pH del agua', unidad: 'pH', valor: s.promedioPh,
        minOk: this.UMBRALES.ph.min, maxOk: this.UMBRALES.ph.max,
        descripcionLimite: `Rango OMS: ${this.UMBRALES.ph.min} – ${this.UMBRALES.ph.max}`,
      },
      {
        nombre: 'Temperatura', unidad: '°C', valor: s.promedioTemperatura,
        minOk: this.UMBRALES.temperatura.min, maxOk: this.UMBRALES.temperatura.max,
        descripcionLimite: `Máx. vida acuática: ${this.UMBRALES.temperatura.max}°C`,
      },
    ];

    if (s.oxigenoDisuelto   != null) params.push({ nombre: 'Oxígeno disuelto',       unidad: 'mg/L',      valor: s.oxigenoDisuelto,   minOk: this.UMBRALES.oxigenoDisuelto.min,   maxOk: this.UMBRALES.oxigenoDisuelto.max,   descripcionLimite: `Mínimo EPA: ${this.UMBRALES.oxigenoDisuelto.min} mg/L` });
    if (s.conductividad     != null) params.push({ nombre: 'Conductividad eléctrica', unidad: 'µS/cm',     valor: s.conductividad,     minOk: 0, maxOk: this.UMBRALES.conductividad.max,     descripcionLimite: `Límite OMS: ${this.UMBRALES.conductividad.max} µS/cm` });
    if (s.turbidez          != null) params.push({ nombre: 'Turbidez',                unidad: 'NTU',       valor: s.turbidez,          minOk: 0, maxOk: this.UMBRALES.turbidez.max,          descripcionLimite: `Límite OMS: ${this.UMBRALES.turbidez.max} NTU` });
    if (s.nitratos          != null) params.push({ nombre: 'Nitratos (NO₃⁻)',         unidad: 'mg/L',      valor: s.nitratos,          minOk: 0, maxOk: this.UMBRALES.nitratos.max,          descripcionLimite: `Límite OMS: ${this.UMBRALES.nitratos.max} mg/L` });
    if (s.coliformesFecales != null) params.push({ nombre: 'Coliformes fecales',      unidad: 'UFC/100mL', valor: s.coliformesFecales, minOk: 0, maxOk: this.UMBRALES.coliformesFecales.max, descripcionLimite: `Límite EPA: ${this.UMBRALES.coliformesFecales.max} UFC/100mL` });
    if (s.dbo5              != null) params.push({ nombre: 'DBO₅',                    unidad: 'mg/L',      valor: s.dbo5,              minOk: 0, maxOk: this.UMBRALES.dbo5.max,              descripcionLimite: `Clase II EPA: < ${this.UMBRALES.dbo5.max} mg/L` });
    if (s.metalesPesados    != null) params.push({ nombre: 'Metales pesados',          unidad: 'mg/L',      valor: s.metalesPesados,    minOk: 0, maxOk: this.UMBRALES.metalesPesados.max,    descripcionLimite: `Referencia EPA: < ${this.UMBRALES.metalesPesados.max} mg/L` });

    return params;
  }

  nivelDeParametro(p: ParametroCalidad): NivelCalidad {
    return this.nivelParametro(p.valor, p.minOk ?? 0, p.maxOk);
  }

  get scoreCalidad(): ScoreCalidad | null {
    const params = this.parametrosCalidad;
    if (!params.length) return null;

    const niveles = params.map(p => this.nivelDeParametro(p));
    const ok      = niveles.filter(n => n === 'ok').length;
    const warn    = niveles.filter(n => n === 'warn').length;
    const danger  = niveles.filter(n => n === 'danger').length;
    const score   = Math.round((ok * 100 + warn * 60) / params.length);

    let clasificacion: ScoreCalidad['clasificacion'];
    let descripcion: string;

    if (score >= 90)      { clasificacion = 'Excelente'; descripcion = 'Todos los parámetros dentro de los rangos OMS/EPA. Apto para consumo y recreación.'; }
    else if (score >= 75) { clasificacion = 'Buena';     descripcion = 'La mayoría de parámetros en rango normal. Tratamiento básico recomendado para consumo.'; }
    else if (score >= 55) { clasificacion = 'Regular';   descripcion = 'Varios parámetros en alerta. No apto para consumo directo. Uso recreativo con restricciones.'; }
    else if (score >= 30) { clasificacion = 'Mala';      descripcion = 'Múltiples parámetros fuera de rango. Requiere tratamiento especializado. Evitar contacto.'; }
    else                  { clasificacion = 'Crítica';   descripcion = 'Niveles críticos de contaminación. Riesgo grave para la salud y el ecosistema. Acción inmediata.'; }

    return { score, clasificacion, descripcion, parametrosOk: ok, parametrosWarn: warn, parametrosDanger: danger };
  }

  scoreCircleClase(clasificacion: string): string {
    const map: Record<string, string> = {
      'Excelente': 'sc-excelente', 'Buena': 'sc-buena',
      'Regular': 'sc-regular', 'Mala': 'sc-mala', 'Crítica': 'sc-critica',
    };
    return map[clasificacion] ?? 'sc-regular';
  }

  // ─── ALERTAS ─────────────────────────────────────────────────

  nivelAlertaClase(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ALTA': case 'ROJA':     return 'nivel-alta';
      case 'MEDIA': case 'NARANJA': return 'nivel-media';
      case 'AMARILLA':              return 'nivel-amarilla';
      default:                      return 'nivel-baja';
    }
  }

  nivelTagClase(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ALTA': case 'ROJA':     return 'tag-alta';
      case 'MEDIA': case 'NARANJA': return 'tag-media';
      case 'AMARILLA':              return 'tag-amarilla';
      default:                      return 'tag-baja';
    }
  }

  nivelDotClase(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ALTA': case 'ROJA':     return 'dot-alta';
      case 'MEDIA': case 'NARANJA': return 'dot-media';
      case 'AMARILLA':              return 'dot-amarilla';
      default:                      return 'dot-baja';
    }
  }

  nivelIcono(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ALTA': case 'ROJA':     return 'ti-alert-octagon';
      case 'MEDIA': case 'NARANJA': return 'ti-alert-triangle';
      case 'AMARILLA':              return 'ti-alert-triangle';
      default:                      return 'ti-info-circle';
    }
  }

  nivelIconoColor(nivel: string): string {
    switch (nivel?.toUpperCase()) {
      case 'ALTA': case 'ROJA':     return '#E24B4A';
      case 'MEDIA': case 'NARANJA': return '#EF9F27';
      case 'AMARILLA':              return '#BA7517';
      default:                      return '#639922';
    }
  }

  // ─── DISTRIBUCIÓN ALERTAS ────────────────────────────────────

  get distribucionAlertas(): { nivel: string; cantidad: number; porcentaje: number; color: string }[] {
    const map = this.estadisticas?.alertasPorNivel ?? {};
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    if (!total) return [];

    const colorMap: Record<string, string> = {
      ALTA: '#E24B4A', ROJA: '#E24B4A',
      MEDIA: '#EF9F27', NARANJA: '#EF9F27',
      AMARILLA: '#BA7517',
      BAJA: '#639922', VERDE: '#639922',
    };

    return Object.entries(map)
      .map(([nivel, cantidad]) => ({
        nivel, cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
        color: colorMap[nivel.toUpperCase()] ?? '#888780',
      }))
      .sort((a, b) => {
        const order: Record<string, number> = { ALTA: 0, ROJA: 0, MEDIA: 1, NARANJA: 1, AMARILLA: 2, BAJA: 3, VERDE: 3 };
        return (order[a.nivel.toUpperCase()] ?? 4) - (order[b.nivel.toUpperCase()] ?? 4);
      });
  }

  // ─── GAUGE ───────────────────────────────────────────────────

  gaugeOffset(valor: number | undefined, min: number, max: number): number {
    if (valor === undefined || valor === null) return 157;
    const pct = Math.min(1, Math.max(0, valor / (max * 1.2)));
    return Math.round(157 - pct * 157);
  }

  gaugeColor(nivel: NivelCalidad): string {
    return { ok: '#639922', warn: '#EF9F27', danger: '#E24B4A' }[nivel];
  }

  // ─── UTILIDADES ──────────────────────────────────────────────

  get estadisticas(): Estadisticas | null {
    const d = this.informeDetalle as any;
    if (!d) return null;
    const raw: Estadisticas = d.estadisticas ?? d.stats ?? d.data ?? null;
    if (!raw) return null;

    if (raw.alertas) {
      raw.alertas = raw.alertas.map((a: any) => ({
        ...a,
        fecha: this._parseDate(a.fecha)?.toISOString() ?? a.fecha,
      }));
    }
    if (raw.eventos) {
      raw.eventos = raw.eventos.map((e: any) => ({
        ...e,
        fecha: this._parseDate(e.fecha)?.toISOString() ?? e.fecha,
      }));
    }
    return raw;
  }

  objetoAArray(obj: { [key: string]: number } | undefined): { clave: string; valor: number }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([clave, valor]) => ({ clave, valor }));
  }

  formVacio(): Informe {
    return { titulo: '', descripcion: '', fechaInicio: '', fechaFin: '', recursoId: 0, contaminanteId: 0 };
  }

  // ─── EXPORTAR PDF ────────────────────────────────────────────

  exportarPDF(): void {
    const id = this.informeSeleccionadoId
      ?? (this.informes.length > 0 ? this.informes[0].id : null);

    if (!id) { alert('No hay informes disponibles para exportar'); return; }

    if (this.informeDetalle && (this.informeDetalle as any).id === id) {
      this._generarPDF();
      return;
    }

    this.informeService.buscarPorId(id).subscribe({
      next: (data) => { this.informeDetalle = data; this._generarPDF(); },
      error: () => alert('Error al cargar el informe para PDF'),
    });
  }

  private _generarPDF(): void {
    const inf   = this.informeDetalle!;
    const stats = this.estadisticas;

    const fmt  = (v: any) => this._fmt(v);
    const fmtD = (v: any) => this._fmtD(v);

    const score = this.scoreCalidad;
    const scoreColor = score
      ? ({'Excelente':'#3B6D11','Buena':'#3B6D11','Regular':'#854F0B','Mala':'#A32D2D','Crítica':'#A32D2D'} as any)[score.clasificacion] ?? '#854F0B'
      : '#888780';

    const paramClase = (n: NivelCalidad) => n === 'ok' ? 'badge-ok' : n === 'warn' ? 'badge-warn' : 'badge-danger';
    const paramLabel = (n: NivelCalidad) => n === 'ok' ? 'Normal' : n === 'warn' ? 'Elevado' : 'Crítico';

    const filasParams = this.parametrosCalidad.map(p => {
      const nivel = this.nivelDeParametro(p);
      const pct   = this.barraProgreso(p.valor, p.maxOk);
      const barC  = nivel === 'ok' ? '#639922' : nivel === 'warn' ? '#EF9F27' : '#E24B4A';
      return `<tr>
        <td>${p.nombre}</td>
        <td class="center">${p.valor ?? '—'} ${p.unidad}</td>
        <td class="center">${p.descripcionLimite}</td>
        <td class="center">
          <div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;width:80px;margin:0 auto">
            <div style="height:100%;width:${pct}%;background:${barC};border-radius:3px"></div>
          </div>
        </td>
        <td class="center"><span class="badge ${paramClase(nivel)}">${paramLabel(nivel)}</span></td>
      </tr>`;
    }).join('');

    const filasMed = stats?.medicionesPorContaminante
      ? Object.entries(stats.medicionesPorContaminante)
          .map(([k, v]) => `<tr><td>${k}</td><td class="center">${v}</td></tr>`).join('')
      : '<tr><td colspan="2" class="empty-row">Sin datos</td></tr>';

    const filasEventos = stats?.eventos?.length
      ? stats.eventos.map(e => `<tr>
          <td>${e.id}</td><td>${e.descripcion}</td>
          <td><span class="badge badge-azul">${e.magnitud}</span></td>
          <td>${fmt(e.fecha)}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" class="empty-row">Sin eventos en el período</td></tr>';

    const filasAlertas = stats?.alertas?.length
      ? stats.alertas.map(a => {
          const cls = ({'ALTA':'danger','ROJA':'danger','MEDIA':'warn','NARANJA':'warn','BAJA':'ok','VERDE':'ok'} as any)[a.nivel?.toUpperCase()] ?? 'ok';
          return `<tr>
            <td>${a.id}</td>
            <td><span class="badge badge-${cls}">${a.nivel}</span></td>
            <td>${a.mensaje}</td>
            <td>${fmt(a.fecha)}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="4" class="empty-row">Sin alertas en el período</td></tr>';

    const filasEvolucion = stats?.evolucionPh?.length
      ? stats.evolucionPh.map((p, i) => `<tr>
          <td>${p.fecha}</td>
          <td class="center">${p.valor}</td>
          <td class="center">${stats!.evolucionTemperatura?.[i]?.valor ?? '—'}</td>
        </tr>`).join('')
      : '<tr><td colspan="3" class="empty-row">Sin datos temporales</td></tr>';

    const alertasPorNivelHtml = stats?.alertasPorNivel
      ? Object.entries(stats.alertasPorNivel).map(([k, v]) => {
          const col = ({'ALTA':'#fff1f2','ROJA':'#fff1f2','MEDIA':'#fff7ed','NARANJA':'#fff7ed','BAJA':'#f0fdf4','VERDE':'#f0fdf4'} as any)[k.toUpperCase()] ?? '#f1f5f9';
          const txt = ({'ALTA':'#be123c','ROJA':'#be123c','MEDIA':'#c2410c','NARANJA':'#c2410c','BAJA':'#15803d','VERDE':'#15803d'} as any)[k.toUpperCase()] ?? '#64748b';
          return `<div style="background:${col};color:${txt};border-radius:12px;padding:12px 18px;text-align:center;min-width:80px">
            <div style="font-size:26px;font-weight:800">${v}</div>
            <div style="font-size:10px;font-weight:700;margin-top:2px;text-transform:uppercase">${k}</div>
          </div>`;
        }).join('')
      : '<p style="color:#94a3b8">Sin alertas registradas</p>';

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8">
<title>${inf.titulo} — AquaBalance</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#2d3748;font-size:13px}
  .portada{background:linear-gradient(135deg,#0077b6,#023e8a);color:white;padding:44px 50px 32px}
  .portada h1{font-size:24px;font-weight:800;margin-bottom:6px}
  .portada h2{font-size:13px;opacity:.85;margin-bottom:24px}
  .chips{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
  .chip{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:4px 14px;font-size:12px;font-weight:600}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;opacity:.65}
  .meta-value{font-size:13px;font-weight:700;margin-top:2px}
  .score-box{border:2px solid ${scoreColor};border-radius:12px;padding:16px 22px;display:flex;align-items:center;gap:18px;margin:20px 50px 0;background:#fff}
  .sc{width:62px;height:62px;border-radius:50%;border:3px solid ${scoreColor};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0}
  .sc-n{font-size:18px;font-weight:800;color:${scoreColor};line-height:1}
  .sc-s{font-size:10px;color:#94a3b8;margin-top:1px}
  .sc-t{font-size:14px;font-weight:700;color:${scoreColor};margin-bottom:3px}
  .sc-d{font-size:11px;color:#64748b}
  .body{padding:20px 50px}
  .sec{margin-bottom:18px}
  .st{font-size:12px;font-weight:700;color:#0077b6;padding-bottom:5px;border-bottom:2px solid #e0f2fe;margin-bottom:10px}
  .g5{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}
  .sc2{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:9px 5px;text-align:center}
  .sc2-n{font-size:18px;font-weight:800;color:#0077b6}
  .sc2-l{font-size:9px;color:#64748b;margin-top:2px;font-weight:500;text-transform:uppercase}
  .niv{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:5px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  thead tr{background:#0077b6;color:white}
  th{padding:7px 10px;text-align:left;font-weight:600;font-size:10px}
  td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
  tbody tr:nth-child(even) td{background:#f8fbff}
  .center{text-align:center}
  .empty-row{text-align:center;color:#94a3b8;padding:10px;font-style:italic}
  .badge{display:inline-block;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700}
  .badge-danger{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}
  .badge-warn{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
  .badge-ok{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0}
  .badge-azul{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
  .pie{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:10px}
  @media print{body,html{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>

<div class="portada">
  <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;opacity:.7;margin-bottom:10px">💧 AquaBalance · Sistema de Monitoreo Hídrico</div>
  <h1>${inf.titulo}</h1>
  <h2>${inf.descripcion || 'Informe de calidad hídrica'}</h2>
  <div class="chips">
    <span class="chip">💧 ${inf.nombreRecurso ?? '—'}</span>
    <span class="chip">🧪 ${inf.nombreContaminante ?? '—'}</span>
  </div>
  <div class="meta">
    <div><div class="meta-label">Período</div><div class="meta-value">${fmtD((inf as any).fechaInicio)} → ${fmtD((inf as any).fechaFin)}</div></div>
    <div><div class="meta-label">Generado</div><div class="meta-value">${fmt((inf as any).fechaGeneracion)}</div></div>
    <div><div class="meta-label">ID</div><div class="meta-value">#${inf.id ?? '—'}</div></div>
  </div>
</div>

${score ? `
<div class="score-box">
  <div class="sc">
    <div class="sc-n">${score.score}</div>
    <div class="sc-s">/ 100</div>
  </div>
  <div>
    <div class="sc-t">Calidad hídrica: ${score.clasificacion}</div>
    <div class="sc-d">${score.descripcion}</div>
    <div style="display:flex;gap:14px;margin-top:8px;font-size:11px">
      <span style="color:#3B6D11;font-weight:700">${score.parametrosOk} normales</span>
      <span style="color:#854F0B;font-weight:700">${score.parametrosWarn} en alerta</span>
      <span style="color:#A32D2D;font-weight:700">${score.parametrosDanger} críticos</span>
    </div>
  </div>
</div>` : ''}

<div class="body">
  <div class="sec">
    <div class="st">Resumen General</div>
    <div class="g5">
      <div class="sc2"><div class="sc2-n">${stats?.totalMediciones ?? 0}</div><div class="sc2-l">Mediciones</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.totalEventos ?? 0}</div><div class="sc2-l">Eventos</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.totalAlertas ?? 0}</div><div class="sc2-l">Alertas</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.promedioPh ?? '—'}</div><div class="sc2-l">pH prom.</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.promedioTemperatura ?? '—'}°</div><div class="sc2-l">Temp.</div></div>
    </div>
  </div>
  <div class="sec">
    <div class="st">Parámetros de Calidad OMS / EPA</div>
    <table><thead><tr><th>Parámetro</th><th>Valor</th><th>Límite</th><th class="center">Nivel</th><th class="center">Estado</th></tr></thead>
    <tbody>${filasParams || '<tr><td colspan="5" class="empty-row">Sin parámetros</td></tr>'}</tbody></table>
  </div>
  <div class="sec">
    <div class="st">Rango de Mediciones</div>
    <div class="g4">
      <div class="sc2"><div class="sc2-n">${stats?.phMinimo ?? '—'}</div><div class="sc2-l">pH mín.</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.phMaximo ?? '—'}</div><div class="sc2-l">pH máx.</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.temperaturaMinima ?? '—'}°</div><div class="sc2-l">T. mín.</div></div>
      <div class="sc2"><div class="sc2-n">${stats?.temperaturaMaxima ?? '—'}°</div><div class="sc2-l">T. máx.</div></div>
    </div>
  </div>
  <div class="sec">
    <div class="st">Alertas por Nivel</div>
    <div class="niv">${alertasPorNivelHtml}</div>
  </div>
  <div class="sec">
    <div class="st">Mediciones por Contaminante</div>
    <table><thead><tr><th>Contaminante</th><th>N° Mediciones</th></tr></thead>
    <tbody>${filasMed}</tbody></table>
  </div>
  <div class="sec">
    <div class="st">Eventos en el Período</div>
    <table><thead><tr><th>ID</th><th>Descripción</th><th>Magnitud</th><th>Fecha</th></tr></thead>
    <tbody>${filasEventos}</tbody></table>
  </div>
  <div class="sec">
    <div class="st">Alertas en el Período</div>
    <table><thead><tr><th>ID</th><th>Nivel</th><th>Mensaje</th><th>Fecha</th></tr></thead>
    <tbody>${filasAlertas}</tbody></table>
  </div>
  <div class="sec">
    <div class="st">Evolución Temporal</div>
    <table><thead><tr><th>Fecha</th><th>pH promedio</th><th>Temperatura (°C)</th></tr></thead>
    <tbody>${filasEvolucion}</tbody></table>
  </div>
  <div class="pie">Generado por AquaBalance · ${fmt(new Date())}</div>
</div>
</body></html>`;

    const ventana = window.open('', '_blank');
    if (!ventana) {
      alert('El navegador bloqueó la ventana emergente. Permite popups para este sitio.');
      return;
    }
    ventana.document.write(html);
    ventana.document.close();
    setTimeout(() => { ventana.print(); ventana.close(); }, 800);
  }
}
