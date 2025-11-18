import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-login',
  standalone: true,
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css'],
  imports: [
    CommonModule,
    FormsModule
  ]
})
export class UserLoginComponent {

  email = '';
  loading = false;
  message = '';
  error = '';

  private router = inject(Router);
  private auth = inject(AuthService);

  login() {
    this.loading = true;
    this.error = '';
    this.message = '';

    this.auth.loginSimple(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Erfolgreich angemeldet.';
        // Weiterleitung passiert bereits im AuthService
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401) {
          this.error = 'Kein Benutzer mit dieser E-Mail gefunden.';
        } else {
          this.error = 'Fehler bei der Anmeldung.';
        }
      }
    });
  }
}
