import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ContaminanteService } from '../../core/services/contaminante.service';
import { Contaminante, NivelContaminante } from '../../core/models/contaminante.model';

@Component({
  selector: 'app-lista-contaminantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-contaminantes.html',
  styleUrl: './lista-contaminantes.css',
})
export class ListaContaminantesComponent implements OnInit {

  contaminantes: Contaminante[] = [];
  cargando = false;
  error = '';

  mostrarFormulario = false;
  modoEdicion = false;

  form: Contaminante = this.formVacio();

  niveles: NivelContaminante[] = ['Bajo', 'Medio', 'Alto', 'Critico'];

  constructor(private contaminanteService: ContaminanteService) {}

  ngOnInit(): void {
    this.cargar();
  }

  // ======================
  // CARGA
  // ======================
  cargar(): void {
    this.cargando = true;

    this.contaminanteService.listar().subscribe({
      next: (data) => {
        this.contaminantes = data || [];
        this.cargando = false;
      },
      error: () => {
        this.error = 'Error al cargar contaminantes';
        this.contaminantes = [];
        this.cargando = false;
      },
    });
  }

  // ======================
  // FORMULARIO
  // ======================

  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.error = '';
  }

  editar(c: Contaminante): void {
    this.form = { ...c };
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
  // GUARDAR (CON VALIDACIONES)
  // ======================

  guardar(): void {

    // 🔥 VALIDACIONES FRONTEND
    if (!this.form.nombre || this.form.nombre.trim().length < 3) {
      this.error = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    if (this.form.carga == null || this.form.carga <= 0) {
      this.error = 'La carga debe ser mayor a 0';
      return;
    }

    if (!this.form.nivel) {
      this.error = 'Debes seleccionar un nivel';
      return;
    }

    if (!this.form.fuenteOrigen || this.form.fuenteOrigen.trim().length < 3) {
      this.error = 'La fuente de origen es obligatoria';
      return;
    }

    // limpiar espacios
    this.form.nombre = this.form.nombre.trim();
    this.form.fuenteOrigen = this.form.fuenteOrigen.trim();

    // ======================
    // PETICIÓN BACKEND
    // ======================
    if (this.modoEdicion && this.form.id) {
      this.contaminanteService.actualizar(this.form.id, this.form).subscribe({
        next: () => {
          this.cargar();
          this.cerrarFormulario();
        },
        error: () => (this.error = 'Error al actualizar contaminante'),
      });
    } else {
      this.contaminanteService.crear(this.form).subscribe({
        next: () => {
          this.cargar();
          this.cerrarFormulario();
        },
        error: () => (this.error = 'Error al crear contaminante'),
      });
    }
  }

  // ======================
  // ELIMINAR
  // ======================
  eliminar(id: number): void {
    if (confirm('¿Eliminar este contaminante?')) {
      this.contaminanteService.eliminar(id).subscribe({
        next: () => this.cargar(),
        error: () => (this.error = 'Error al eliminar'),
      });
    }
  }

  // ======================
  // UTILIDADES
  // ======================
  nivelColor(nivel: string): string {
    const colores: Record<string, string> = {
      Bajo: 'badge-verde',
      Medio: 'badge-amarillo',
      Alto: 'badge-naranja',
      Critico: 'badge-rojo',
    };
    return colores[nivel] || '';
  }

  // ======================
  // FORM VACÍO
  // ======================
  formVacio(): Contaminante {
    return {
      nombre: '',
      carga: 0,
      nivel: 'Bajo',
      fuenteOrigen: ''
    };
  }
}
