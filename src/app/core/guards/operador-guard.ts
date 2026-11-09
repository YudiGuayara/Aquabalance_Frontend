import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/** Solo Administrador y Operador. El usuario publico vuelve al inicio (sin cerrar sesion). */
export const operadorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin() || auth.isOperador()) return true;

  router.navigate(['/dashboard/home']);
  return false;
};
