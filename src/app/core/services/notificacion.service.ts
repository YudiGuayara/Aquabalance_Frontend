import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient }            from '@angular/common/http';
import { BehaviorSubject }       from 'rxjs';
import { Client, IMessage, StompConfig } from '@stomp/stompjs';
import { Notificacion }          from '../models/notificacion.model';
import { API_CONFIG }            from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class NotificacionService implements OnDestroy {

  private readonly baseUrl = `${API_CONFIG.BASE_URL}/api/notificaciones`;
  private stompClient!: Client;
  private inicializado = false;

  private _notificaciones$ = new BehaviorSubject<Notificacion[]>([]);
  private _noLeidas$       = new BehaviorSubject<number>(0);

  readonly notificaciones$ = this._notificaciones$.asObservable();
  readonly noLeidas$       = this._noLeidas$.asObservable();

  constructor(private http: HttpClient) {}

  /** Llamar desde DashboardComponent.ngOnInit() — solo una vez tras el login */
  inicializar(): void {
    if (this.inicializado) return;
    this.inicializado = true;
    console.log('🔔 NotificacionService inicializado — cargando historial...');
    this.cargarHistorial();
    setTimeout(() => this.conectarWebSocket(), 1500);
  }

  cargarHistorial(): void {
    console.log('📡 GET', this.baseUrl);
    this.http.get<Notificacion[]>(this.baseUrl).subscribe({
      next: (lista) => {
        console.log('✅ Historial cargado:', lista.length, 'notificaciones');
        this._notificaciones$.next(lista);
        this._actualizarContador(lista);
      },
      error: (err) => console.error('❌ Error cargando historial:', err),
    });
  }

  marcarLeida(id: number): void {
    console.log('🟡 marcarLeida() — id:', id);
    this.http.put<void>(`${this.baseUrl}/${id}/leer`, {}).subscribe({
      next: () => {
        console.log('✅ Marcada como leída — id:', id);
        const actualizadas = this._notificaciones$.value.map(n =>
          n.id === id ? { ...n, leida: true } : n
        );
        this._notificaciones$.next(actualizadas);
        this._actualizarContador(actualizadas);
      },
      error: (err) => console.error('❌ Error marcando leída — id:', id, err),
    });
  }

  marcarTodasLeidas(): void {
    console.log('🟡 marcarTodasLeidas()');
    this.http.put<void>(`${this.baseUrl}/marcar-leidas`, {}).subscribe({
      next: () => {
        console.log('✅ Todas marcadas como leídas');
        const actualizadas = this._notificaciones$.value.map(n => ({ ...n, leida: true }));
        this._notificaciones$.next(actualizadas);
        this._noLeidas$.next(0);
      },
      error: (err) => console.error('❌ Error marcando todas leídas:', err),
    });
  }

  private conectarWebSocket(): void {
    const SockJS = (window as any)['SockJS'];
    if (!SockJS) {
      console.warn('⚠️ SockJS no disponible — agrega el script en angular.json');
      return;
    }

    const config: StompConfig = {
      webSocketFactory: () => new SockJS(`${API_CONFIG.BASE_URL}/ws`),
      reconnectDelay:   10000,
      connectionTimeout: 5000,
      onConnect: () => {
        console.log('🔌 WebSocket notificaciones conectado');
        this.stompClient.subscribe('/topic/notificaciones', (msg: IMessage) => {
          const nueva: Notificacion = JSON.parse(msg.body);
          console.log('📨 Nueva notificación por WebSocket:', nueva.titulo);
          const lista = [nueva, ...this._notificaciones$.value].slice(0, 50);
          this._notificaciones$.next(lista);
          this._actualizarContador(lista);
        });
      },
      onDisconnect:     () => console.warn('🔌 WebSocket desconectado'),
      onStompError:     (frame: unknown) => console.error('❌ STOMP error:', frame),
      onWebSocketError: (event: unknown) => console.error('❌ WS error:', event),
    };

    this.stompClient = new Client(config);
    this.stompClient.activate();
  }

  private _actualizarContador(lista: Notificacion[]): void {
    this._noLeidas$.next(lista.filter(n => !n.leida).length);
  }

  ngOnDestroy(): void {
    this.stompClient?.deactivate();
  }
}
