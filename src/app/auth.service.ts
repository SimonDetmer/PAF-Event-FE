import { Injectable } from '@angular/core';
import { User } from './user.service';

interface SessionData {
  token: string;
  userId: number;
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

  getUserId(): number | null {
    return this.read()?.userId ?? null;
  }

  getRole(): 'eventmanager' | 'customer' | '' {
    return this.read()?.role ?? '';
  }

  getEmail(): string | undefined {
    return this.read()?.email ?? undefined;
  }

  login(user: User): void {
    const token = `jwt.${btoa(JSON.stringify({ 
      sub: user.id, 
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    }))}.signature`;
    
    this.write({ 
      token, 
      userId: user.id,
      role: user.role, 
      email: user.email 
    });
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  }
  
  getCurrentUser(): { id: number; email: string; role: string } | null {
    const session = this.read();
    if (!session) return null;
    
    return {
      id: session.userId,
      email: session.email || '',
      role: session.role
    };
  }
}
