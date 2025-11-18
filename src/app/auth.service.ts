import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User } from './models/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  http = inject(HttpClient);
  router = inject(Router);

  private api = 'http://localhost:8080';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const jwt = this.getJwt();
    if (jwt) {
      this.loadUserProfile();
    }
  }

  // ------------------------------------------------------------
  //  SIMPLE LOGIN – only email
  // ------------------------------------------------------------
  loginSimple(email: string) {
    return this.http.post<{ jwt: string; user: User }>(
      `${this.api}/auth/login-simple?email=${email}`,
      {}
    ).pipe(
      tap(response => {
        this.saveJwt(response.jwt);
        this.currentUserSubject.next(response.user);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  // ------------------------------------------------------------
  //  LOAD PROFILE AFTER REFRESH
  // ------------------------------------------------------------
  loadUserProfile() {
    this.http.get<User>(`${this.api}/users/me`).subscribe({
      next: user => this.currentUserSubject.next(user),
      error: () => this.logout()
    });
  }

  // ------------------------------------------------------------
  //  JWT HELPERS
  // ------------------------------------------------------------
  saveJwt(jwt: string) {
    localStorage.setItem('jwt', jwt);
  }

  getJwt(): string | null {
    return localStorage.getItem('jwt');
  }

  logout() {
    localStorage.removeItem('jwt');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.getJwt();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
