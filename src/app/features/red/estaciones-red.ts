import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, filter, of, switchMap, timer } from 'rxjs';
import {
  EstacionRed,
  EstadoEstacion,
  ProtocoloRed,
  Telemetria,
} from '../../core/models/estacion-red.model';
import { AuthService } from '../../core/services/auth.service';
import { EstacionRedService } from '../../core/services/estacion-red.service';

interface RangoProtocolo {
  latencia: [number, number];
  senal: [number, number];
}

// Valores típicos de cada tecnología (LoRaWAN: más lenta y con señal más débil)
const RANGOS: Record<ProtocoloRed, RangoProtocolo> = {
  HTTP: { latencia: [40, 120], senal: [-75, -55] },
  MQTT: { latencia: [60, 180], senal: [-80, -60] },
  LORAWAN: { latencia: [200, 600], senal: [-100, -80] },
};

@Component({
  selector: 'app-estaciones-red',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estaciones-red.html',
  styleUrl: './estaciones-red.css',
})
export class EstacionesRedComponent {
  private readonly servicio = inject(EstacionRedService);

  private readonly auth = inject(AuthService);

  /** Solo Administrador y Operador pueden enviar telemetría (el backend lo exige). */
  readonly puedeSimular = this.auth.isAdmin() || this.auth.isOperador();

  readonly estaciones = signal<EstacionRed[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly simulando = signal(false);
  readonly apagadas = signal<ReadonlySet<number>>(new Set<number>());
  readonly eventos = signal<string[]>([]);

  private readonly bateria = new Map<number, number>();

  readonly resumen = computed(() => {
    const lista = this.estaciones();
    const contar = (estado: EstadoEstacion) => lista.filter((e) => e.estado === estado).length;

    const conEnlace = lista.filter(
      (e) => (e.estado === 'EN_LINEA' || e.estado === 'DEGRADADA') && e.latenciaMs !== null,
    );
    const latenciaPromedio = conEnlace.length
      ? Math.round(conEnlace.reduce((suma, e) => suma + (e.latenciaMs ?? 0), 0) / conEnlace.length)
      : null;

    const recibidos = lista.reduce((suma, e) => suma + e.paquetesRecibidos, 0);
    const perdidos = lista.reduce((suma, e) => suma + e.paquetesPerdidos, 0);
    const total = recibidos + perdidos;

    return {
      total: lista.length,
      enLinea: contar('EN_LINEA'),

      degradadas: contar('DEGRADADA'),
      fuera: contar('FUERA_DE_LINEA'),
      latenciaPromedio,
      perdidaPct: total ? Math.round((perdidos * 1000) / total) / 10 : 0,
    };
  });

  constructor() {
    // Refresca el estado de la red cada 3 segundos
    timer(0, 3000)
      .pipe(
        switchMap(() =>
          this.servicio.listar().pipe(
            catchError(() => {
              this.error.set('No se pudo consultar la red de estaciones. ¿El backend está activo?');
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((lista) => {
        this.cargando.set(false);
        if (lista) {
          this.error.set(null);
          this.estaciones.set(lista);
        }
      });

    // Simulador: cada 5 segundos cada sensor "transmite" por la red
    timer(0, 5000)
      .pipe(

        filter(() => this.simulando()),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.simularTransmision());
  }

  alternarSimulador(): void {
    this.simulando.update((activo) => !activo);
    this.registrar(this.simulando() ? '▶ Simulador de sensores iniciado' : '⏸ Simulador detenido');
  }

  alternarFalla(estacion: EstacionRed): void {
    const conjunto = new Set(this.apagadas());
    if (conjunto.has(estacion.id)) {
      conjunto.delete(estacion.id);
      this.registrar(`🔌 ${estacion.nombre}: enlace restablecido`);
    } else {
      conjunto.add(estacion.id);
      this.registrar(`⚡ ${estacion.nombre}: falla de red simulada (dejará de transmitir)`);
    }
    this.apagadas.set(conjunto);
  }

  private simularTransmision(): void {
    for (const estacion of this.estaciones()) {
      if (this.apagadas().has(estacion.id)) continue;

      // ~5% de los paquetes se pierden en el camino
      if (Math.random() < 0.05) {
        this.servicio.registrarPerdida(estacion.id).subscribe({ error: () => undefined });
        this.registrar(`✖ ${estacion.nombre}: paquete perdido`);
        continue;

      }

      const telemetria = this.generarTelemetria(estacion);
      this.servicio.enviarTelemetria(estacion.id, telemetria).subscribe({ error: () => undefined });
      this.registrar(
        `✔ ${estacion.nombre} → ${estacion.protocolo} ${telemetria.latenciaMs} ms, ${telemetria.senalDbm} dBm`,
      );
    }
  }

  private generarTelemetria(estacion: EstacionRed): Telemetria {
    const rango = RANGOS[estacion.protocolo];

    let latencia = this.aleatorio(rango.latencia[0], rango.latencia[1]);
    if (Math.random() < 0.08) latencia += 700; // pico de congestión ocasional

    const bateriaActual =
      this.bateria.get(estacion.id) ?? estacion.bateriaPct ?? 60 + Math.floor(Math.random() * 40);
    const bateriaNueva = Math.max(5, bateriaActual - 0.3);
    this.bateria.set(estacion.id, bateriaNueva);

    return {
      latenciaMs: latencia,
      senalDbm: this.aleatorio(rango.senal[0], rango.senal[1]),
      bateriaPct: Math.round(bateriaNueva),
    };
  }

  private aleatorio(min: number, max: number): number {
    return Math.round(min + Math.random() * (max - min));
  }


  private registrar(mensaje: string): void {
    const hora = new Date().toLocaleTimeString('es-CO');
    this.eventos.update((lista) => [`${hora}  ${mensaje}`, ...lista].slice(0, 12));
  }

  // ── Ayudas para la plantilla ────────────────────────────────────────────

  textoEstado(estado: EstadoEstacion): string {
    const textos: Record<EstadoEstacion, string> = {
      EN_LINEA: 'En línea',
      DEGRADADA: 'Degradada',
      FUERA_DE_LINEA: 'Fuera de línea',
      SIN_DATOS: 'Sin datos',
    };
    return textos[estado];
  }

  /** Barras de señal (1 a 4) según la potencia recibida en dBm. */
  barras(dbm: number | null): number {
    if (dbm === null) return 0;
    if (dbm >= -70) return 4;
    if (dbm >= -85) return 3;
    if (dbm >= -100) return 2;
    return 1;
  }

  hace(segundos: number | null): string {
    if (segundos === null) return 'nunca';
    if (segundos < 60) return `hace ${segundos} s`;
    return `hace ${Math.floor(segundos / 60)} min`;
  }
}
