import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';
import { DashboardComponent } from './dashboard';
import { MapaComponent } from '../mapa/mapa.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('../home/home').then(m => m.HomeComponent),
      },
      {
        path: 'recursos',
        loadComponent: () =>
          import('../recursos/lista-recursos').then(m => m.ListaRecursosComponent),
      },
      {
        path: 'contaminantes',
        loadComponent: () =>
          import('../contaminantes/lista-contaminantes').then(m => m.ListaContaminantesComponent),
      },
      {
        path: 'mediciones',
        loadComponent: () =>
          import('../mediciones/lista-mediciones').then(m => m.ListaMedicionesComponent),
      },
      {
        path: 'eventos',
        loadComponent: () =>
          import('../eventos/lista-eventos').then(m => m.ListaEventosComponent),
      },
      {
        path: 'alertas',
        loadComponent: () =>
          import('../alertas/lista-alertas').then(m => m.ListaAlertasComponent),
      },
      {
        path: 'clima',
        loadComponent: () =>
          import('../clima/clima.component').then(m => m.ClimaComponent),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('../reportes/lista-informes').then(m => m.ListaInformesComponent),
      },
      {
        path: 'mapa',
        component: MapaComponent,
      },
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('../notificaciones/lista-notificaciones')
            .then(m => m.ListaNotificacionesComponent),
      },
    ],
  },
];
