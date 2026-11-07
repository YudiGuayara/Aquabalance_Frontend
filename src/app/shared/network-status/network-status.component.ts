import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NetworkStatusService } from '../../core/services/network-status.service';

@Component({
  selector: 'app-network-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="net" [attr.data-calidad]="estado().calidad" [title]="detalle()">
      <span class="dot"></span>
      <span class="txt">{{ etiqueta() }}</span>
    </div>
  `,
  styles: [
    `
      .net {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid #e2e8f0;
        background: #f7fafc;
        color: #1a3c5e;
        font-size: 13px;
        font-weight: 500;
        cursor: default;
        white-space: nowrap;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #a0aec0;
      }
      [data-calidad='buena'] .dot { background: #38a169; }
      [data-calidad='regular'] .dot { background: #d69e2e; }
      [data-calidad='lenta'] .dot { background: #dd6b20; }
      [data-calidad='sin-servidor'] .dot,
      [data-calidad='sin-internet'] .dot { background: #e53e3e; }
      [data-calidad='verificando'] .dot { animation: pulso 1s infinite; }

      @keyframes pulso {
        50% { opacity: 0.3; }
      }
    `,
  ],
})
export class NetworkStatusComponent {
  private readonly network = inject(NetworkStatusService);

  readonly estado = toSignal(this.network.status$, { requireSync: true });

  readonly etiqueta = computed(() => {
    const e = this.estado();
    switch (e.calidad) {
      case 'verificando':  return 'Verificando…';
      case 'sin-internet': return 'Sin Internet';
      case 'sin-servidor': return 'Servidor no disponible';
      default:             return `${e.latenciaMs} ms`;
    }
  });

  readonly detalle = computed(() => {
    const e = this.estado();
    const hora = e.ultimaMedicion ? e.ultimaMedicion.toLocaleTimeString('es-CO') : '-';
    const ip = e.ipCliente ?? 'desconocida';
    return `Calidad de la conexión: ${e.calidad} · IP del cliente: ${ip} · Última medición: ${hora}`;
  });
}
