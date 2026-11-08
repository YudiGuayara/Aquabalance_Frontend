import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  MensajeResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../models/auth.model';

// setTimeout no admite retardos mayores a 2^31-1 ms (~24,8 dias)
const MAX_TIMEOUT_MS = 2_147_483_647;

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;
  private temporizadorExpiracion: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private router: Router) {
    // Si ya hay una sesion guardada (recarga de pagina), se programa su cierre automatico
    this.programarExpiracion();
  }

  // 🔹 Registro
  registro(data: RegisterRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/registro`, data);
  }

  // 🔹 Verificación de correo
  verificarEmail(token: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/verificar-email`, { token });
  }

  reenviarVerificacion(email: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/reenviar-verificacion`, { email });
  }

  // 🔹 Recuperación de contraseña
  olvidePassword(email: string): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/olvide-password`, { email });
  }

  restablecerPassword(data: ResetPasswordRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.apiUrl}/restablecer-password`, data);
  }

  // 🔹 Login
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response));
        this.programarExpiracion();
      })
    );
  }

  // 🔹 Logout manual
  logout(): void {
    this.limpiarSesion();
  }

  /**
   * La sesion termino sin que el usuario lo pidiera (token vencido o 401 del servidor):
   * limpia todo y manda al login con el aviso. Si ya no hay sesion no hace nada,
   * asi varias peticiones que fallan a la vez solo navegan una vez.
   */
  expirarSesion(): void {
    if (!localStorage.getItem('token')) return;
    this.limpiarSesion();
    this.router.navigate(['/auth/login'], { queryParams: { sesion: 'expirada' } });
  }

  // 🔹 Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 🔹 Verificar login (un token vencido cuenta como sin sesion)
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    if (this.estaVencido(token)) {
      this.limpiarSesion();
      return false;
    }
    return true;
  }

  // 🔹 Obtener usuario
  getUsuario(): AuthResponse | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  // 🔹 Obtener rol
  getRol(): string {
    return this.getUsuario()?.rol || '';
  }

  // 🔹 Usuario público
  isPublico(): boolean {
    return this.getRol() === 'UsuarioPublico';
  }

  // 🔹 Administrador
  isAdmin(): boolean {
    return this.getRol() === 'Administrador';
  }

  // 🔹 Operador
  isOperador(): boolean {
    return this.getRol() === 'Operador';
  }

  // ── Privados ──────────────────────────────────────────────

  private limpiarSesion(): void {
    if (this.temporizadorExpiracion) {
      clearTimeout(this.temporizadorExpiracion);
      this.temporizadorExpiracion = null;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  /** Cierra la sesion sola cuando el token vence. */
  private programarExpiracion(): void {
    if (this.temporizadorExpiracion) {
      clearTimeout(this.temporizadorExpiracion);
      this.temporizadorExpiracion = null;
    }

    const token = this.getToken();
    const expMs = token ? this.leerExpiracionMs(token) : null;
    if (expMs === null) return;

    const espera = Math.min(Math.max(expMs - Date.now(), 0), MAX_TIMEOUT_MS);
    this.temporizadorExpiracion = setTimeout(() => this.expirarSesion(), espera);
  }

  private estaVencido(token: string): boolean {
    const expMs = this.leerExpiracionMs(token);
    return expMs !== null && expMs <= Date.now();
  }

  /** Lee el claim "exp" del JWT (en ms). Si el token es ilegible devuelve null y decide el servidor. */
  private leerExpiracionMs(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      const exp = JSON.parse(json)?.exp;
      return typeof exp === 'number' ? exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
