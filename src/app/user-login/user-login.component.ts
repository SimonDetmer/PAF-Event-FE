import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

// Services
import { AuthService, User } from '../auth.service';
import { UserService } from '../user.service';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
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
    private userService: UserService,
    private snackBar: MatSnackBar
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

    // In a real app, you would call your backend to authenticate
    this.userService.getUserByEmail(this.email)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (user) => {
          // In a real app, you would get a real token from your backend
          const mockToken = `mock-jwt-token-${Date.now()}`;
          this.snackBar.open('Erfolgreich angemeldet', 'OK', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.auth.login(user, mockToken);
        },
        error: (error) => {
          console.error('Login error:', error);
          
          let errorMessage = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
          
          if (error.status === 404) {
            errorMessage = 'Kein Benutzer mit dieser E-Mail gefunden. Bitte legen Sie einen Benutzer an.';
          } else if (error.status === 401) {
            errorMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und versuchen Sie es erneut.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.error = errorMessage;
          this.snackBar.open(errorMessage, 'OK', { 
            duration: 5000, 
            panelClass: ['error-snackbar'] 
          });
        }
      });
  }

  goToCreateUser(): void {
    this.router.navigate(['/create-user'], {
      state: { email: this.email }
    });
  }

  cancel(): void {
    this.router.navigate(['/login']);
  }
}
