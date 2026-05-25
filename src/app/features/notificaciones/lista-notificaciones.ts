import { Component, OnInit } from '@angular/core';
import { CommonModule }        from '@angular/common';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion }        from '../../core/models/notificacion.model';
import { Observable }          from 'rxjs';

type Filtro = 'TODAS' | 'NO_LEIDAS' | 'ALERTA' | 'INFORME' | 'MEDICION';
const FILTROS: Filtro[] = ['TODAS', 'NO_LEIDAS', 'ALERTA', 'INFORME', 'MEDICION'];

@Component({
  selector: 'app-lista-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-notificaciones.html',
  styleUrls: ['./lista-notificaciones.css'],
})
export class ListaNotificacionesComponent implements OnInit {

  notificaciones$!: Observable<Notificacion[]>;
  noLeidas$!:       Observable<number>;

  readonly filtros = FILTROS;
  filtroActivo: Filtro = 'TODAS';

  constructor(public notificacionService: NotificacionService) {}

  ngOnInit(): void {
    this.notificaciones$ = this.notificacionService.notificaciones$;
    this.noLeidas$       = this.notificacionService.noLeidas$;
  }

  // Solo expande/colapsa — NO marca como leída
  toggleExpandir(n: Notificacion): void {
    n.expandida = !n.expandida;
  }

  // Solo el botón ✓ marca como leída
  marcarLeida(id: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.notificacionService.marcarLeida(id);
  }

  marcarTodasLeidas(): void {
    this.notificacionService.marcarTodasLeidas();
  }

  setFiltro(filtro: Filtro): void {
    this.filtroActivo = filtro;
  }

  filtrar(lista: Notificacion[]): Notificacion[] {
    switch (this.filtroActivo) {
      case 'NO_LEIDAS': return lista.filter(n => !n.leida);
      case 'ALERTA':    return lista.filter(n => n.tipo === 'ALERTA');
      case 'INFORME':   return lista.filter(n => n.tipo === 'INFORME');
      case 'MEDICION':  return lista.filter(n => n.tipo === 'MEDICION');
      default:          return lista;
    }
  }

  labelFiltro(f: Filtro): string {
    const labels: Record<Filtro, string> = {
      TODAS: 'Todas', NO_LEIDAS: 'No leídas',
      ALERTA: 'Alertas', INFORME: 'Informes', MEDICION: 'Mediciones',
    };
    return labels[f];
  }

  iconoPorTipo(tipo: string): string {
    const m: Record<string, string> = { ALERTA: '🚨', INFORME: '📄', MEDICION: '📊' };
    return m[tipo] ?? '🔔';
  }

  clasePorNivel(nivel: string): string {
    if (!nivel) return 'nivel-info';
    switch (nivel.toUpperCase()) {
      case 'ALTA':  case 'ROJA':    case 'CRITICA':  return 'nivel-alta';
      case 'MEDIA': case 'NARANJA': case 'MODERADA': return 'nivel-media';
      case 'BAJA':  case 'VERDE':                    return 'nivel-baja';
      default:                                        return 'nivel-info';
    }
  }


  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  trackById(_: number, n: Notificacion): number { return n.id; }
}
