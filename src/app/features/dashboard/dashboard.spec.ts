import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardComponent } from './dashboard';
import { NotificacionService } from '../../core/services/notificacion.service';
import { NetworkStatusService } from '../../core/services/network-status.service';
import { BehaviorSubject } from 'rxjs';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  // Se simula el servicio de notificaciones para no abrir un WebSocket real en el test
  const notificacionesFalso = {
    notificaciones$: new BehaviorSubject([]),
    noLeidas$: new BehaviorSubject(0),
    inicializar: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodasLeidas: vi.fn(),
  };

  // El monitor de red real mide cada 15 s con un timer permanente: eso impide que whenStable() termine
  const redFalsa = {
    status$: new BehaviorSubject({
      internet: true, servidor: true, latenciaMs: 50, calidad: 'buena',
      ipCliente: null, ultimaMedicion: null,
    }),
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificacionService, useValue: notificacionesFalso },
        { provide: NetworkStatusService, useValue: redFalsa },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
