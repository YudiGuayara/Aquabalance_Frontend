import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UsuarioService } from './usuario';
import { environment } from '../../../environments/environment';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let backend: HttpTestingController;
  const url = `${environment.apiUrl}/api/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuarioService);
    backend = TestBed.inject(HttpTestingController);
  });

  it('desactiva con PATCH /desactivar cuando el usuario está activo', () => {
    service.toggleActivo({ id: 7, nombre: 'A', email: 'a@a.co', rol: 'Operador', activo: true }).subscribe();
    const req = backend.expectOne(`${url}/7/desactivar`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });

  it('activa con PATCH /activar cuando el usuario está inactivo', () => {
    service.toggleActivo({ id: 7, nombre: 'A', email: 'a@a.co', rol: 'Operador', activo: false }).subscribe();
    const req = backend.expectOne(`${url}/7/activar`);
    expect(req.request.method).toBe('PATCH');
    req.flush(null);
  });
});
