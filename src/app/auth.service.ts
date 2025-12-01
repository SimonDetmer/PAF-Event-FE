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

  // aktueller User-Status
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const jwt = this.getJwt();
    if (jwt) {
      // Beim Reload Profil nachladen
      this.loadUserProfile();
    }
  }

  /**
   * Einfacher Login nur mit E-Mail:
   * POST /auth/login-simple?email=...
   * Antwort: { jwt, user }
   */
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

  /**
   * Profil laden (für F5 / Seite neu laden)
   */
  loadUserProfile() {
    const jwt = this.getJwt();

    // Falls es (inzwischen) gar kein JWT mehr gibt, nichts tun
    if (!jwt) {
      this.currentUserSubject.next(null);
      return;
    }

    this.http.get<User>(`${this.api}/api/users/me`).subscribe({
      next: user => {
        // Nur dann den User setzen, wenn es noch ein JWT gibt.
        // Wenn in der Zwischenzeit logout() aufgerufen wurde, ist jwt weg.
        if (this.getJwt()) {
          this.currentUserSubject.next(user);
        }
      },
      error: () => this.logout() // JWT ungültig -> rauswerfen
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
    // UI-Zustand zurücksetzen
    this.currentUserSubject.next(null);
    this.router.navigate(['/user-login']);
  }

  // 🔴 WICHTIG: Für das UI nur noch auf currentUser hören
  isAuthenticated(): boolean {
    // Für die Anzeige von Toolbar/Sidebar reicht:
    // currentUser != null
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
