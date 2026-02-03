import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);
  private router = inject(Router);

  private api = 'http://localhost:8080';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const jwt = this.getJwt();
    if (jwt) {
      this.loadUserProfile();
    }
  }

  loginSimple(email: string) {
    return this.http.post<{ jwt: string; user: User }>(
      `${this.api}/auth/login-simple?email=${encodeURIComponent(email)}`,
      {}
    ).pipe(
      tap(response => {
        // JWT speichern
        this.saveJwt(response.jwt);
        // User im State halten
        this.currentUserSubject.next(response.user);
        // Weiter zum Dashboard
        this.router.navigate(['/dashboard']);
      })
    );
  }


  loadUserProfile() {
    const jwt = this.getJwt();


    if (!jwt) {
      this.currentUserSubject.next(null);
      return;
    }

    this.http.get<User>(`${this.api}/api/users/me`).subscribe({
      next: user => {
        if (this.getJwt()) {
          this.currentUserSubject.next(user);
        }
      },
      error: () => this.logout()
    });
  }

  // ---------- JWT Helpers ----------

  saveJwt(jwt: string) {
    localStorage.setItem('jwt', jwt);
  }

  getJwt(): string | null {
    return localStorage.getItem('jwt');
  }

  logout() {
    localStorage.removeItem('jwt');
    this.currentUserSubject.next(null);
    this.router.navigate(['/user-login']);
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
