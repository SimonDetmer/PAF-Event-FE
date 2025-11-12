import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../api.config';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
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

  error: string = '';

  createUser(): void {
    this.error = '';
    
    if (!this.selectedRole) {
      this.error = 'Bitte wählen Sie eine Rolle aus.';
      return;
    }
    
    if (!this.email) {
      this.error = 'Bitte geben Sie eine E-Mail-Adresse ein.';
      return;
    }
    
    if (!this.email.includes('@')) {
      this.error = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      return;
    }
    
    this.loading = true;
    const payload = { 
      email: this.email,
      role: this.selectedRole 
    };
    
    this.http.post<any>(`${this.apiBase}/users`, payload).subscribe({
      next: (response) => {
        // Navigate to dashboard with role, include email for customer to auto-load data
        const queryParams: any = { role: this.selectedRole };
        if (this.selectedRole === 'customer') {
          queryParams.email = this.email;
        }
        this.router.navigate(['/dashboard'], { queryParams });
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.error = err.error?.message || 'Benutzer konnte nicht erstellt werden. Bitte versuchen Sie es später erneut.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }
}
