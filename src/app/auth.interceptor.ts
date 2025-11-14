import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token from the service
    const session = this.authService.getSession();
    let authReq = request;

    // Clone the request and add the authorization header if we have a token
    if (session?.token) {
      authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // If no token, just clone the request with content type
      authReq = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Send the request and handle the response
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized responses
        if (error.status === 401) {
          // Clear the current session and redirect to login
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        // Handle 403 Forbidden responses
        if (error.status === 403) {
          // You might want to show a more specific message to the user
          console.error('Access denied. You do not have permission to perform this action.');
        }
        
        // Re-throw the error so that the component can handle it if needed
        return throwError(() => error);
      })
    );
  }
}
