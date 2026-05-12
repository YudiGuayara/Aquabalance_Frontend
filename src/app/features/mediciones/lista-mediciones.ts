import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MedicionService } from '../../core/services/medicion.service';
import { RecursoService } from '../../core/services/recurso.service';
import { ContaminanteService } from '../../core/services/contaminante.service';
import { AuthService } from '../../core/services/auth.service';

import { Medicion } from '../../core/models/medicion.model';
import { Recurso } from '../../core/models/recurso.model';
import { Contaminante } from '../../core/models/contaminante.model';

@Component({
  selector: 'app-lista-mediciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-mediciones.html',
  styleUrl: './lista-mediciones.css',
})
export class ListaMedicionesComponent implements OnInit {

  mediciones: Medicion[] = [];
  recursos: Recurso[] = [];
  contaminantes: Contaminante[] = [];

  cargando = false;
  error = '';

  mostrarFormulario = false;
  modoEdicion = false;

  form: Medicion = this.formVacio();

  constructor(
    private medicionService: MedicionService,
    private recursoService: RecursoService,
    private contaminanteService: ContaminanteService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
  }

  // ======================
  // CARGAR
  // ======================
  cargar(): void {
    this.cargando = true;

    this.medicionService.listar().subscribe({
      next: (data) => {
        this.mediciones = data || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar mediciones';
        this.cargando = false;
      },
    });
  }

  cargarRecursos(): void {
    this.recursoService.listar().subscribe({
      next: (data) => (this.recursos = data || [])
    });
  }

  cargarContaminantes(): void {
    this.contaminanteService.listar().subscribe({
      next: (data) => (this.contaminantes = data || [])
    });
  }

  // ======================
  // FORM
  // ======================
  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
  }

  editar(m: Medicion): void {
    this.form = { ...m };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.error = '';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.form = this.formVacio();
    this.error = '';
  }

  // ======================
  // VALIDACIÓN
  // ======================
  validar(): boolean {

    if (!this.form.idRecurso) {
      this.error = 'Debes seleccionar un recurso';
      return false;
    }

    if (!this.form.idContaminante) {
      this.error = 'Debes seleccionar un contaminante';
      return false;
    }

    if (this.form.ph == null) {
      this.error = 'El pH es obligatorio';
      return false;
    }

    if (this.form.ph < 0 || this.form.ph > 14) {
      this.error = 'El pH debe estar entre 0 y 14';
      return false;
    }

    if (this.form.temperatura == null) {
      this.error = 'La temperatura es obligatoria';
      return false;
    }

    return true;
  }

  // ======================
  // GUARDAR / ACTUALIZAR
  // ======================
  guardar(): void {

    if (!this.validar()) return;

    this.form.idUsuario = 1;

    const payload = {
      ph: this.form.ph,
      temperatura: this.form.temperatura,
      idUsuario: this.form.idUsuario,
      idRecurso: this.form.idRecurso,
      idContaminante: this.form.idContaminante
    };

    if (this.modoEdicion && this.form.id) {

      this.medicionService.actualizar(this.form.id, payload as any).subscribe({
        next: () => {
          this.cargar();
          this.cerrarFormulario();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar medición';
        }
      });

    } else {

      this.medicionService.registrar(payload as any).subscribe({
        next: () => {
          this.cargar();
          this.cerrarFormulario();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al registrar medición';
        }
      });

    }
  }

  // ======================
  // ELIMINAR
  // ======================
  eliminar(id: number): void {
    if (confirm('¿Eliminar esta medición?')) {
      this.medicionService.eliminar(id).subscribe({
        next: () => this.cargar(),
        error: () => this.error = 'Error al eliminar'
      });
    }
  }

  // ======================
  // HELPERS
  // ======================
  nombreRecurso(id: number): string {
    return this.recursos.find(r => r.id === id)?.nombre || '';
  }

  nombreContaminante(id: number): string {
    return this.contaminantes.find(c => c.id === id)?.nombre || '';
  }

  formVacio(): Medicion {
    return {
      ph: 7,
      temperatura: 20,
      idUsuario: 1,
      idRecurso: 0,
      idContaminante: 0
    };
  }
}
