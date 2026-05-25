import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.model';
import { RecursoService } from '../../core/services/recurso.service';
import { MedicionService } from '../../core/services/medicion.service';
import { AlertaService } from '../../core/services/alerta.service';
import { EventoService } from '../../core/services/evento.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {

  usuario: AuthResponse | null = null;
  totalRecursos = 0;
  totalMediciones = 0;
  totalAlertas = 0;
  totalEventos = 0;
  cargando = true;

  constructor(
    private authService: AuthService,
    private recursoService: RecursoService,
    private medicionService: MedicionService,
    private alertaService: AlertaService,
    private eventoService: EventoService,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.recursoService.listar().subscribe({
      next: (data) => this.totalRecursos = data.length,
    });
    this.medicionService.listar().subscribe({
      next: (data) => this.totalMediciones = data.length,
    });
    this.alertaService.listar().subscribe({
      next: (data) => { this.totalAlertas = data.length; this.cargando = false; },
    });
    this.eventoService.listar().subscribe({
      next: (data) => this.totalEventos = data.length,
    });
  }

  saludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }
}
