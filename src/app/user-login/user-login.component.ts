import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api.config';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {
  email: string = '';
  loading = false;
  error: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(API_BASE_URL) private readonly apiBase: string,
  ) {}

  login(): void {
    this.error = '';
    if (!this.email || !this.email.includes('@')) {
      this.error = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      return;
    }
    this.loading = true;
    this.http.get<boolean>(`${this.apiBase}/users/email/${encodeURIComponent(this.email)}`).subscribe({
      next: (exists) => {
        if (exists) {
          // Navigate to customer dashboard and auto-load data
          this.router.navigate(['/dashboard'], { queryParams: { role: 'customer', email: this.email } });
        } else {
          this.error = 'Kein Benutzer mit dieser E-Mail gefunden. Bitte legen Sie einen Benutzer an.';
        }
      },
      error: () => {
        this.error = 'Anmeldung nicht möglich. Bitte versuchen Sie es später erneut.';
      },
      complete: () => (this.loading = false)
    });
  }

  createUser(): void {
    this.router.navigate(['/create-user']);
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }
}
