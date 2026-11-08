import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from '../services/auth.service';

/**
 * Un 401 del backend con sesion iniciada significa token vencido o invalido:
 * se cierra la sesion y se manda al login.
 * No actua en: el login (401 = contraseña incorrecta), el resto de /api/auth,
 * un 403 (falta de rol, la sesion sigue valida) ni APIs externas.
 */
export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.url.startsWith(API_CONFIG.BASE_URL) &&
        !req.url.includes('/api/auth/') &&
        auth.getToken()
      ) {
        auth.expirarSesion();
      }
      return throwError(() => error);
    })
  );
};
