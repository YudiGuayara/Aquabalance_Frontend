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

  // ✅ CONTROL DE USUARIO PÚBLICO
  esPublico = false;

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

    // ✅ VALIDAR ROL
    const rol = localStorage.getItem('rol');

    // Solo usuario público queda bloqueado
    this.esPublico = rol === 'PUBLICO';

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

  // ─── FORMULARIO ──────────────────────────────────────────────

  abrirFormulario(): void {

    // ✅ BLOQUEAR SOLO AL PÚBLICO
    if (this.esPublico) {
      return;
    }

    this.form = this.formVacio();
    this.modoEdicion = false;
    this.errorModal = '';
    this.mostrarFormulario = true;
  }

  abrirEdicion(informe: Informe): void {

    // ✅ BLOQUEAR SOLO AL PÚBLICO
    if (this.esPublico) {
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

  eliminar(id: number): void {

    // ✅ BLOQUEAR SOLO AL PÚBLICO
    if (this.esPublico) {
      return;
    }

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

    // ✅ BLOQUEAR SOLO AL PÚBLICO
    if (this.esPublico) {
      return;
    }

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
        this.errorModal =
          err.error?.message ||
          `Error al ${this.modoEdicion ? 'actualizar' : 'crear'} el informe`;
      },
    });
  }

  // ─── UTILIDADES ──────────────────────────────────────────────

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

  get estadisticas(): Estadisticas | null {
    const d = this.informeDetalle as any;

    if (!d) return null;

    return d.estadisticas ?? null;
  }

  objetoAArray(obj: { [key: string]: number } | undefined): { clave: string; valor: number }[] {
    if (!obj) return [];

    return Object.entries(obj).map(([clave, valor]) => ({
      clave,
      valor,
    }));
  }

  // ─── PDF ─────────────────────────────────────────────────────

  exportarPDF(): void {

    // ✅ EL PÚBLICO SÍ PUEDE EXPORTAR PDF

    const id =
      this.informeSeleccionadoId ??
      (this.informes.length > 0 ? this.informes[0].id : null);

    if (!id) {
      alert('No hay informes disponibles para exportar');
      return;
    }

    if (this.informeDetalle && (this.informeDetalle as any).id === id) {
      this._generarPDF();
      return;
    }

    this.informeService.buscarPorId(id).subscribe({
      next: (data) => {
        this.informeDetalle = data;
        this._generarPDF();
      },
      error: () => alert('Error al cargar el informe para PDF'),
    });
  }

  private _generarPDF(): void {

    // TU CÓDIGO PDF SE QUEDA EXACTAMENTE IGUAL
    // NO NECESITAS CAMBIAR NADA AQUÍ

  }
}
