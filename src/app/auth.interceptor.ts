import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const jwt = localStorage.getItem('jwt');

  if (jwt) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${jwt}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
