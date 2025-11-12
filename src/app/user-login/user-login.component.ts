import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';

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
    private router: Router,
    private auth: AuthService,
    private userService: UserService
  ) {}

  login(): void {
    this.error = '';
    this.loading = true;

    // Basic validation
    if (!this.email) {
      this.error = 'Bitte geben Sie eine E-Mail-Adresse ein.';
      this.loading = false;
      return;
    }

    if (!this.email.includes('@')) {
      this.error = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      this.loading = false;
      return;
    }

    console.log('Attempting login with email:', this.email);

    this.userService.getUserByEmail(this.email).subscribe({
      next: (user) => {
        try {
          console.log('User found, logging in...', user);
          // Generate a mock token for the user
          const mockToken = `mock-jwt-token-${Date.now()}`;
          // The login method will handle the navigation
          this.auth.login(user, mockToken);
        } catch (error) {
          console.error('Login error:', error);
          this.error = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Login API error:', error);

        // Handle different error cases
        if (error.status === 0) {
          this.error = 'Verbindung zum Server fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.';
        } else if (error.status === 404 || error.message === 'User not found' || error.message.includes('nicht gefunden')) {
          this.error = 'Kein Benutzer mit dieser E-Mail gefunden. Bitte legen Sie einen Benutzer an.';
        } else if (error.status === 401) {
          this.error = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und versuchen Sie es erneut.';
        } else {
          this.error = error.message || 'Anmeldung nicht möglich. Bitte versuchen Sie es später erneut.';
        }

        this.loading = false;
      },
      complete: () => {
        console.log('Login process completed');
        this.loading = false;
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/create-user']);
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }
}
