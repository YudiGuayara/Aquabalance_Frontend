import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AlertaService } from '../../core/services/alerta.service';
import { EventoService } from '../../core/services/evento.service';
import { AuthService } from '../../core/services/auth.service';

import { Alerta, NivelAlerta } from '../../core/models/alerta.model';
import { Evento } from '../../core/models/evento.model';

@Component({
  selector: 'app-lista-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-alertas.html',
  styleUrl: './lista-alertas.css',
})
export class ListaAlertasComponent implements OnInit {

  alertas: Alerta[] = [];
  eventos: Evento[] = [];

  cargando = false;
  guardando = false;

  error = '';

  mostrarFormulario = false;
  modoEdicion = false;

  filtroNivel: NivelAlerta | '' = '';

  // 🔹 Usuario público
  isPublico = false;

  niveles: NivelAlerta[] = [
    'Verde',
    'Amarilla',
    'Naranja',
    'Roja'
  ];

  form: Alerta = this.formVacio();

  constructor(
    private alertaService: AlertaService,
    private eventoService: EventoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    // 🔹 Validar rol
    this.isPublico = this.authService.isPublico();

    this.cargar();
    this.cargarEventos();
  }

  cargar(): void {

    this.cargando = true;

    this.alertaService.listar().subscribe({

      next: (data) => {

        this.alertas = data;
        this.cargando = false;
      },

      error: () => {

        this.error = 'Error al cargar alertas';
        this.cargando = false;
      },
    });
  }

  cargarEventos(): void {

    this.eventoService.listar().subscribe({

      next: (data) => {

        this.eventos = data;
      },
    });
  }

  filtrarPorNivel(): void {

    if (this.filtroNivel) {

      this.alertaService
        .listarPorNivel(this.filtroNivel)
        .subscribe({

          next: (data) => {

            this.alertas = data;
          },
        });

    } else {

      this.cargar();
    }
  }

  abrirFormulario(): void {

    this.form = this.formVacio();

    this.modoEdicion = false;

    this.mostrarFormulario = true;
  }

  editar(alerta: Alerta): void {

    this.form = { ...alerta };

    this.modoEdicion = true;

    this.mostrarFormulario = true;
  }

  guardar(): void {

    if (this.guardando) return;

    this.guardando = true;

    this.error = '';

    // 🔹 ACTUALIZAR
    if (this.modoEdicion && this.form.id) {

      this.alertaService
        .actualizar(this.form.id, this.form)
        .subscribe({

          next: (alertaActualizada) => {

            const index = this.alertas.findIndex(
              a => a.id === alertaActualizada.id
            );

            if (index !== -1) {

              this.alertas[index] = alertaActualizada;
            }

            this.cerrarFormulario();

            this.guardando = false;
          },

          error: () => {

            this.error = 'Error al actualizar alerta';

            this.guardando = false;
          }
        });

    }

    // 🔹 CREAR
    else {

      this.alertaService
        .crear(this.form)
        .subscribe({

          next: (nuevaAlerta) => {

            this.alertas.unshift(nuevaAlerta);

            this.cerrarFormulario();

            this.guardando = false;
          },

          error: () => {

            this.error = 'Error al crear alerta';

            this.guardando = false;
          }
        });
    }
  }

  eliminar(id: number): void {

    if (confirm('¿Eliminar esta alerta?')) {

      this.alertaService.eliminar(id).subscribe({

        next: () => this.cargar(),

        error: () => {

          this.error = 'Error al eliminar';
        },
      });
    }
  }

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.modoEdicion = false;

    this.form = this.formVacio();
  }

  nivelColor(nivel: string): string {

    const colores: Record<string, string> = {

      Verde: 'badge-verde',
      Amarilla: 'badge-amarillo',
      Naranja: 'badge-naranja',
      Roja: 'badge-rojo',
    };

    return colores[nivel] || '';
  }

  formVacio(): Alerta {

    return {

      nivel: 'Verde',
      mensaje: '',
      idUsuario: 1,
      idEvento: 0
    };
  }
}
