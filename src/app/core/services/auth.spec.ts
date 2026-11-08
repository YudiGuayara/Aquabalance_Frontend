import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';

/** Arma un JWT sin firma real (el frontend solo lee el claim "exp"). */
function jwtQueVenceEn(segundos: number): string {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const exp = Math.floor(Date.now() / 1000) + segundos;
  return `${b64({ alg: 'HS256' })}.${b64({ sub: 'a@b.co', exp })}.firma`;
}

describe('AuthService — expiración de sesión', () => {
  const navigate = vi.fn();

  function crearServicio(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), { provide: Router, useValue: { navigate } }],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('sin token no hay sesión', () => {
    expect(crearServicio().isLoggedIn()).toBe(false);
  });

  it('con token vigente hay sesión', () => {
    localStorage.setItem('token', jwtQueVenceEn(3600));
    expect(crearServicio().isLoggedIn()).toBe(true);
  });

  it('con token vencido no hay sesión y se limpia el almacenamiento', () => {
    localStorage.setItem('token', jwtQueVenceEn(-10));
    localStorage.setItem('usuario', '{}');
    const auth = crearServicio();

    expect(auth.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();
  });

  it('un token ilegible no rompe nada (se trata como vigente y decide el servidor)', () => {
    localStorage.setItem('token', 'no-es-un-jwt');
    expect(crearServicio().isLoggedIn()).toBe(true);
  });

  it('expirarSesion limpia todo y manda al login con el aviso', () => {
    localStorage.setItem('token', jwtQueVenceEn(3600));
    localStorage.setItem('usuario', '{}');
    const auth = crearServicio();

    auth.expirarSesion();

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { sesion: 'expirada' } });
  });

  it('expirarSesion es idempotente: varias llamadas seguidas navegan una sola vez', () => {
    localStorage.setItem('token', jwtQueVenceEn(3600));
    const auth = crearServicio();

    auth.expirarSesion();
    auth.expirarSesion();

    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it('cierra la sesión automáticamente cuando el token vence', () => {
    vi.useFakeTimers();
    localStorage.setItem('token', jwtQueVenceEn(5));
    crearServicio();

    vi.advanceTimersByTime(4000);
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
