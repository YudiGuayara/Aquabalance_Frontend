import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./registro/registro').then((m) => m.RegistroComponent),
  },
  {
    path: 'verificar-email',
    loadComponent: () =>
      import('./verificar-email/verificar-email').then((m) => m.VerificarEmailComponent),
  },
  {
    path: 'olvide-password',
    loadComponent: () =>
      import('./olvide-password/olvide-password').then((m) => m.OlvidePasswordComponent),
  },
  {
    path: 'restablecer-password',
    loadComponent: () =>
      import('./restablecer-password/restablecer-password').then(
        (m) => m.RestablecerPasswordComponent,
      ),
  },
];
