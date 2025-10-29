import { Injectable } from '@angular/core';

interface SessionData {
  token: string;
  role: 'eventmanager' | 'customer' | '';
  email?: string;
}

const SESSION_KEY = 'session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private read(): SessionData | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) as SessionData : null;
    } catch {
      return null;
    }
  }

  private write(data: SessionData): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }

  isAuthenticated(): boolean {
    const s = this.read();
    return !!(s && s.token);
  }

  getToken(): string | null {
    return this.read()?.token ?? null;
  }

  getRole(): 'eventmanager' | 'customer' | '' {
    return this.read()?.role ?? '';
  }

  getEmail(): string | undefined {
    return this.read()?.email ?? undefined;
  }

  loginWithRole(role: 'eventmanager' | 'customer', email?: string): void {
    // mock token
    const token = `mock-${role}-${Date.now()}`;
    this.write({ token, role, email });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }
}
