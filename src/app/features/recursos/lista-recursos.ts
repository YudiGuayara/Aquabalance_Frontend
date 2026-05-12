import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecursoService } from '../../core/services/recurso.service';
import { Recurso, TipoRecurso } from '../../core/models/recurso.model';

@Component({
  selector: 'app-lista-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-recursos.html',
  styleUrl: './lista-recursos.css',
})
export class ListaRecursosComponent implements OnInit {

  recursos: Recurso[] = [];
  cargando = false;
  error = '';
  mostrarFormulario = false;
  modoEdicion = false;

  form: Recurso = this.formVacio();
  tiposRecurso: TipoRecurso[] = ['Rio', 'Lago', 'Planta', 'Embalse', 'Acuifero'];

  constructor(private recursoService: RecursoService) {}

  ngOnInit(): void {
    this.cargarRecursos();
  }

  // =========================
  // CARGAR
  // =========================
  cargarRecursos(): void {
    this.cargando = true;

    this.recursoService.listar().subscribe({
      next: (data) => {
        this.recursos = data || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar recursos';
        this.recursos = [];
        this.cargando = false;
      },
    });
  }

  // =========================
  // FORMULARIO
  // =========================
  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
  }

  editar(recurso: Recurso): void {
    this.form = { ...recurso };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.form = this.formVacio();
    this.error = '';
  }

  // =========================
  // GUARDAR CON VALIDACIONES
  // =========================
  guardar(): void {

    // 🔥 VALIDACIONES FRONT
    if (!this.form.nombre || this.form.nombre.trim().length < 3) {
      this.error = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (!this.form.tipo) {
      this.error = 'Debes seleccionar un tipo de recurso';
      return;
    }

    if (!this.form.ubicacion || this.form.ubicacion.trim().length < 3) {
      this.error = 'La ubicación es obligatoria';
      return;
    }

    if (this.form.latitud === null || this.form.latitud === undefined) {
      this.error = 'Latitud inválida';
      return;
    }

    if (this.form.longitud === null || this.form.longitud === undefined) {
      this.error = 'Longitud inválida';
      return;
    }

    // limpiar error
    this.error = '';

    // =========================
    // ACTUALIZAR / CREAR
    // =========================
    if (this.modoEdicion && this.form.id) {

      this.recursoService.actualizar(this.form.id, this.form).subscribe({
        next: () => {
          this.cargarRecursos();
          this.cerrarFormulario();
        },
        error: () => (this.error = 'Error al actualizar recurso'),
      });

    } else {

      this.recursoService.crear(this.form).subscribe({
        next: () => {
          this.cargarRecursos();
          this.cerrarFormulario();
        },
        error: () => (this.error = 'Error al crear recurso'),
      });
    }
  }

  // =========================
  // ELIMINAR
  // =========================
  eliminar(id: number): void {
    if (confirm('¿Eliminar este recurso?')) {
      this.recursoService.eliminar(id).subscribe({
        next: () => this.cargarRecursos(),
        error: () => (this.error = 'Error al eliminar recurso'),
      });
    }
  }

  // =========================
  // UTIL
  // =========================
  formVacio(): Recurso {
    return {
      nombre: '',
      tipo: 'Rio',
      ubicacion: '',
      latitud: 0,
      longitud: 0
    };
  }
}
