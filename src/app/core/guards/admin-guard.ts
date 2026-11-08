import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const usuario     = authService.getUsuario();

  if (usuario?.rol === 'Administrador') {
    return true;
  }

  router.navigate(['/dashboard/home']);
  return false;
};

// 🔹 Bloquea al UsuarioPublico — solo Admin y Operador
export const noPublicoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  if (!authService.isPublico()) {
    return true;
  }

  router.navigate(['/dashboard/home']);
  return false;
};
