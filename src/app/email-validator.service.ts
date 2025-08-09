import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidator, ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EmailValidatorService implements AsyncValidator {
  constructor(private http: HttpClient) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const email = control.value;

    if (!email) {
      return of(null);
    }

    return of(email).pipe(
      debounceTime(300), // 300ms warten, um unnötige Requests zu vermeiden
      take(1),
      switchMap(emailValue =>
        this.http.get<boolean>(`http://localhost:8080/users/email/${emailValue}`).pipe(
          map(exists => (exists ? { emailTaken: true } : null)),
          catchError(() => of(null))
        )
      )
    );
  }
}
