import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api.config';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {
  selectedRole: 'eventmanager' | 'customer' | '' = '';
  email: string = '';
  loading = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(API_BASE_URL) private readonly apiBase: string,
  ) {}

  createUser(): void {
    if (!this.selectedRole) {
      alert('Bitte wählen Sie eine Rolle.');
      return;
    }
    if (!this.email || !this.email.includes('@')) {
      alert('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      return;
    }
    this.loading = true;
    const payload = { email: this.email };
    this.http.post<any>(`${this.apiBase}/users`, payload).subscribe({
      next: () => {
        // Navigate to dashboard with role, include email for customer to auto-load data
        const queryParams: any = { role: this.selectedRole };
        if (this.selectedRole === 'customer') {
          queryParams.email = this.email;
        }
        this.router.navigate(['/dashboard'], { queryParams });
      },
      error: err => {
        console.error('Error creating user:', err);
        alert('Benutzer konnte nicht erstellt werden.');
      },
      complete: () => (this.loading = false)
    });
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }
}
