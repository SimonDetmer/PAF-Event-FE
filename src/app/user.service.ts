import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_BASE_URL } from './api.config';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'customer' | 'eventmanager';
  // Add other user properties as needed
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiBaseUrl: string
  ) {
    // Try to load user from localStorage on service initialization
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse user data from localStorage', e);
      }
    }
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiBaseUrl}/users/${userId}`).pipe(
      tap(user => this.setCurrentUser(user)),
      catchError(error => {
        console.error('Error fetching user:', error);
        throw error;
      })
    );
  }

  getUserByEmail(email: string): Observable<User> {
    const url = `${this.apiBaseUrl}/users/email/${encodeURIComponent(email)}`;
    console.log('Fetching user by email from:', url);
    
    return this.http.get<User>(url).pipe(
      tap({
        next: (user: User) => {
          console.log('User found:', user);
          if (user) {
            this.setCurrentUser(user);
          } else {
            throw new Error('User not found');
          }
        },
        error: (error) => {
          console.error('Error in getUserByEmail:', {
            error,
            status: error.status,
            statusText: error.statusText,
            url,
            email
          });
        }
      }),
      catchError(error => {
        console.error('Error in getUserByEmail catchError:', {
          error,
          status: error.status,
          statusText: error.statusText,
          url,
          email
        });
        
        // Return a more descriptive error
        if (error.status === 0) {
          throw new Error('Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.');
        } else if (error.status === 404) {
          throw new Error('Benutzer nicht gefunden');
        } else {
          throw new Error('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
        }
      })
    );
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  clearUser(): void {
    this.setCurrentUser(null);
  }
}
