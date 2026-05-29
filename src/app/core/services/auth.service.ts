import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  // 🔹 Registro
  registro(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/registro`, data);
  }

  // 🔹 Login
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap((response: AuthResponse) => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('usuario', JSON.stringify(response));
      })
    );
  }

  // 🔹 Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  }

  // 🔹 Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 🔹 Verificar login
  isLoggedIn(): boolean {
    return !!this.getToken();
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
}
