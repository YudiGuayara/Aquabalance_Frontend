import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

// 0 = sin red / servidor no alcanzable, 502/503/504 = servidor caído o "despertando"
const ERRORES_DE_RED = [0, 502, 503, 504];
const MAX_REINTENTOS = 2;

/**
 * Reintenta automáticamente las peticiones GET cuando falla la red.
 * Espera 1 s antes del primer reintento y 2 s antes del segundo.
 * No toca POST/PUT/DELETE (para no duplicar operaciones) ni el ping del monitor.
 */
export const networkInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || req.url.includes('/api/network/ping')) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_REINTENTOS,
      delay: (error: HttpErrorResponse, intento: number) =>
        ERRORES_DE_RED.includes(error.status)
          ? timer(intento * 1000)
          : throwError(() => error),
    }),
  );
};
