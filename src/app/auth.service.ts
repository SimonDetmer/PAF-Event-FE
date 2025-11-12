import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  email: string;
  role: 'eventmanager' | 'customer';
  firstName?: string;
  lastName?: string;
}

interface SessionData {
  user: User;
  token: string;
  expiresAt: number;
}

const SESSION_KEY = 'event_app_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private router: Router) {
    // Initialize with user from localStorage if available
    const session = this.getSession();
    this.currentUserSubject = new BehaviorSubject<User | null>(session?.user || null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  private getSession(): SessionData | null {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return null;

      const data: SessionData = JSON.parse(session);
      
      // Check if session is expired
      if (data.expiresAt < Date.now()) {
        this.clearSession();
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error reading session:', error);
      this.clearSession();
      return null;
    }
  }

  private setSession(user: User, token: string): void {
    const session: SessionData = {
      user,
      token,
      expiresAt: Date.now() + SESSION_DURATION
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.currentUserSubject.next(user);
  }

  isAuthenticated(): boolean {
    const session = this.getSession();
    if (session) {
      // Update the current user from session
      this.currentUserSubject.next(session.user);
      return true;
    }
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  login(user: User, token: string): void {
    this.setSession(user, token);
    
    // Navigate based on user role
    if (user.role === 'eventmanager') {
      this.router.navigate(['/event-overview']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    this.currentUserSubject.next(null);
  }
}
