import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../../core/services/evento.service';
import { RecursoService } from '../../core/services/recurso.service';
import { ContaminanteService } from '../../core/services/contaminante.service';
import { Evento } from '../../core/models/evento.model';
import { Recurso } from '../../core/models/recurso.model';
import { Contaminante } from '../../core/models/contaminante.model';

@Component({
  selector: 'app-lista-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-eventos.html',
  styleUrl: './lista-eventos.css',
})
export class ListaEventosComponent implements OnInit {
  eventos: Evento[] = [];
  recursos: Recurso[] = [];
  contaminantes: Contaminante[] = [];
  cargando = false;
  error = '';
  guardando = false;
  mostrarFormulario = false;
  modoEdicion = false;

  magnitudes = ['Baja', 'Media', 'Alta', 'Critica'];
  form: Evento = this.formVacio();

  constructor(
    private eventoService: EventoService,
    private recursoService: RecursoService,
    private contaminanteService: ContaminanteService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarRecursos();
    this.cargarContaminantes();
  }

  cargar(): void {
    this.cargando = true;
    this.eventoService.listar().subscribe({
      next: (data) => { this.eventos = data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar eventos'; this.cargando = false; },
    });
  }

  cargarRecursos(): void {
    this.recursoService.listar().subscribe({
      next: (data) => (this.recursos = data),
    });
  }

  cargarContaminantes(): void {
    this.contaminanteService.listar().subscribe({
      next: (data) => (this.contaminantes = data),
    });
  }

  abrirFormulario(): void {
    this.form = this.formVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
  }

  editar(evento: Evento): void {
    this.form = { ...evento };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
  }

  guardar(): void {

    if (this.guardando) return;

    this.guardando = true;
    this.error = '';

    if (this.modoEdicion && this.form.id) {

      this.eventoService.actualizar(this.form.id, this.form)
        .subscribe({

          next: (eventoActualizado) => {

            const index = this.eventos.findIndex(
              e => e.id === eventoActualizado.id
            );

            if (index !== -1) {
              this.eventos[index] = eventoActualizado;
            }

            this.cerrarFormulario();
            this.guardando = false;
          },

          error: () => {
            this.error = 'Error al actualizar evento';
            this.guardando = false;
          }
        });

    } else {

      this.eventoService.crear(this.form)
        .subscribe({

          next: (nuevoEvento) => {

            this.eventos.unshift(nuevoEvento);

            this.cerrarFormulario();
            this.guardando = false;
          },

          error: () => {
            this.error = 'Error al crear evento';
            this.guardando = false;
          }
        });
    }
  }

  eliminar(id: number): void {
    if (confirm('¿Eliminar este evento?')) {
      this.eventoService.eliminar(id).subscribe({
        next: () => this.cargar(),
        error: () => (this.error = 'Error al eliminar'),
      });
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.form = this.formVacio();
  }

  nombreRecurso(id: number): string {
    return this.recursos.find(r => r.id === id)?.nombre || String(id);
  }

  nombreContaminante(id: number): string {
    return this.contaminantes.find(c => c.id === id)?.nombre || String(id);
  }

  magnitudColor(magnitud: string): string {
    const colores: Record<string, string> = {
      Baja: 'badge-verde',
      Media: 'badge-amarillo',
      Alta: 'badge-naranja',
      Critica: 'badge-rojo',
    };
    return colores[magnitud] || '';
  }

  formVacio(): Evento {
    return { descripcion: '', magnitud: 'Baja', idContaminante: 0, idRecurso: 0 };
  }
}
