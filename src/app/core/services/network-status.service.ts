import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, fromEvent, merge, of, timer } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import { API_CONFIG } from '../config/api.config';

export type CalidadRed =
  | 'verificando'
  | 'buena'
  | 'regular'
  | 'lenta'
  | 'sin-servidor'
  | 'sin-internet';

export interface EstadoRed {
  internet: boolean;          // el navegador tiene conexión a la red
  servidor: boolean;          // el backend respondió al ping
  latenciaMs: number | null;  // tiempo de ida y vuelta (RTT) en milisegundos
  calidad: CalidadRed;
  ipCliente: string | null;   // IP pública del cliente, vista por el servidor
  ultimaMedicion: Date | null;
}

interface PingResponse {
  status: string;
  timestamp: number;
  clientIp: string;
}

/** Clasifica la calidad de la conexión según la latencia medida. */
export function calcularCalidad(latenciaMs: number): CalidadRed {
  if (latenciaMs < 300) return 'buena';
  if (latenciaMs < 800) return 'regular';
  return 'lenta';
}

@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {
  private readonly pingUrl = `${API_CONFIG.BASE_URL}/api/network/ping`;
  private readonly intervaloMs = 15000; // mide cada 15 s
  // Render (plan gratis) puede tardar en "despertar" el servidor, por eso 10 s
  private readonly timeoutMs = 10000;

  private readonly estado$ = new BehaviorSubject<EstadoRed>({
    internet: navigator.onLine,
    servidor: false,
    latenciaMs: null,
    calidad: 'verificando',
    ipCliente: null,
    ultimaMedicion: null,
  });
  readonly status$ = this.estado$.asObservable();

  private readonly sub = new Subscription();

  constructor(private http: HttpClient) {
    // Mide al iniciar, cada 15 s y cada vez que el navegador pierde/recupera la red
    const cambiosDeRed$ = merge(fromEvent(window, 'online'), fromEvent(window, 'offline'));

    this.sub.add(
      merge(timer(0, this.intervaloMs), cambiosDeRed$)
        .pipe(switchMap(() => this.medir()))
        .subscribe((estado) => this.estado$.next(estado)),
    );
  }

  private medir(): Observable<EstadoRed> {
    if (!navigator.onLine) {
      return of(this.construir(false, false, null, null));
    }

    const inicio = performance.now();
    return this.http
      .get<PingResponse>(this.pingUrl, { params: { t: Date.now() } })
      .pipe(
        timeout(this.timeoutMs),
        map((resp) =>
          this.construir(true, true, Math.round(performance.now() - inicio), resp.clientIp ?? null),
        ),
        catchError(() => of(this.construir(true, false, null, null))),
      );
  }

  private construir(
    internet: boolean,
    servidor: boolean,
    latenciaMs: number | null,
    ipCliente: string | null,
  ): EstadoRed {
    let calidad: CalidadRed = 'sin-internet';
    if (internet && !servidor) calidad = 'sin-servidor';
    if (internet && servidor && latenciaMs !== null) calidad = calcularCalidad(latenciaMs);

    return { internet, servidor, latenciaMs, calidad, ipCliente, ultimaMedicion: new Date() };
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
