export interface User {
  id: number;
  email: string;

  // Felder, die deine App benötigt
  firstName?: string;
  lastName?: string;
  role?: string;

  // optionale zusätzliche Felder
  createdAt?: string;
}
