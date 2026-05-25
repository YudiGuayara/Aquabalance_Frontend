import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthResponse } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {

  usuario: AuthResponse | null = null;

  notificaciones$!: Observable<Notificacion[]>;
  noLeidas$!: Observable<number>;
  panelAbierto = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    public notificacionService: NotificacionService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.usuario         = this.authService.getUsuario();
    this.notificaciones$ = this.notificacionService.notificaciones$;
    this.noLeidas$       = this.notificacionService.noLeidas$;

    // Conecta al backend SOLO después del login, dentro del dashboard
    this.notificacionService.inicializar();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const panel   = this.elRef.nativeElement.querySelector('.notif-panel');
    const trigger = this.elRef.nativeElement.querySelector('.btn-campana');
    if (panel && trigger &&
        !panel.contains(event.target as Node) &&
        !trigger.contains(event.target as Node)) {
      this.panelAbierto = false;
    }
  }

  togglePanel(): void       { this.panelAbierto = !this.panelAbierto; }
  verTodas(): void          { this.panelAbierto = false; this.router.navigate(['/dashboard/notificaciones']); }
  marcarTodasLeidas(): void { this.notificacionService.marcarTodasLeidas(); }

  marcarLeida(id: number, event: Event): void {
    event.stopPropagation();
    this.notificacionService.marcarLeida(id);
  }

  iconoPorTipo(tipo: string): string {
    const m: Record<string, string> = { ALERTA: '🚨', INFORME: '📄', MEDICION: '📊' };
    return m[tipo] ?? '🔔';
  }

  clasePorNivel(nivel: string): string {
    const m: Record<string, string> = {
      ALTA: 'nv-alta', MEDIA: 'nv-media', BAJA: 'nv-baja', INFO: 'nv-info',
    };
    return m[nivel] ?? 'nv-info';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  esAdmin(): boolean    { return this.usuario?.rol === 'Administrador'; }
  esOperador(): boolean { return this.usuario?.rol === 'Operador' || this.esAdmin(); }
}
