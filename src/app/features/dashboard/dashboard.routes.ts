import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';
import { DashboardComponent } from './dashboard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'mediciones',
        pathMatch: 'full',
      },
      {
        path: 'recursos',
        loadComponent: () =>
          import('../recursos/lista-recursos')
            .then(m => m.ListaRecursosComponent),
      },
      {
        path: 'contaminantes',
        loadComponent: () =>
          import('../contaminantes/lista-contaminantes')
            .then(m => m.ListaContaminantesComponent),
      },
      {
        path: 'mediciones',
        loadComponent: () =>
          import('../mediciones/lista-mediciones')
            .then(m => m.ListaMedicionesComponent),
      }
    ]
  }
];
