import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {

  const token = localStorage.getItem('token');

  const isExternalApi =
    req.url.includes('open-meteo.com') ||
    req.url.includes('nasa.gov') ||
    req.url.includes('noaa.gov');

  if (!isExternalApi && token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};
