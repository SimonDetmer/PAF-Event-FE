import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidator, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class EmailValidatorService implements AsyncValidator {
  constructor(private http: HttpClient, @Inject(API_BASE_URL) private readonly apiBase: string) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const email = control.value;

    if (!email) {
      return of(null);
    }

    return of(email).pipe(
      debounceTime(300),
      take(1),
      switchMap(emailValue =>
        this.http.get<boolean>(`${this.apiBase}/users/email/${emailValue}`).pipe(
          map(exists => (exists ? { emailTaken: true } : null)),
          catchError(() => of(null))
        )
      )
    );
  }
}
