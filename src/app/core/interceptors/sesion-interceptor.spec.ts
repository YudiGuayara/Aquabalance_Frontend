import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sesionInterceptor } from './sesion-interceptor';
import { API_CONFIG } from '../config/api.config';

describe('sesionInterceptor', () => {
  const navigate = vi.fn();
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sesionInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  it('un 401 con sesión iniciada cierra la sesión y manda al login', () => {
    localStorage.setItem('token', 'x.y.z');
    http.get(`${API_CONFIG.BASE_URL}/api/recursos`).subscribe({ error: () => undefined });

    backend.expectOne(`${API_CONFIG.BASE_URL}/api/recursos`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { sesion: 'expirada' } });
  });

  it('un 401 en /api/auth/login (contraseña incorrecta) NO cierra nada', () => {
    localStorage.setItem('token', 'x.y.z');
    http.post(`${API_CONFIG.BASE_URL}/api/auth/login`, {}).subscribe({ error: () => undefined });

    backend.expectOne(`${API_CONFIG.BASE_URL}/api/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('un 403 (sin permiso de rol) NO cierra la sesión', () => {
    localStorage.setItem('token', 'x.y.z');
    http.get(`${API_CONFIG.BASE_URL}/api/usuarios`).subscribe({ error: () => undefined });

    backend.expectOne(`${API_CONFIG.BASE_URL}/api/usuarios`)
      .flush({}, { status: 403, statusText: 'Forbidden' });

    expect(navigate).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('x.y.z');
  });

  it('un 401 de una API externa NO cierra la sesión', () => {
    localStorage.setItem('token', 'x.y.z');
    http.get('https://api.open-meteo.com/v1/forecast').subscribe({ error: () => undefined });

    backend.expectOne('https://api.open-meteo.com/v1/forecast')
      .flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });
});
