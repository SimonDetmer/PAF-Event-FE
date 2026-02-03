import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../auth.service';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatRadioModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {

  email: string = '';
  selectedRole: 'customer' | 'eventmanager' | '' = '';
  loading = false;
  message = '';
  error = '';

  private apiBase = 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {}

  createUser() {
    this.error = '';
    this.message = '';

    if (!this.email) {
      this.error = 'Bitte E-Mail eingeben.';
      return;
    }

    if (!this.selectedRole) {
      this.error = 'Bitte eine Rolle auswählen.';
      return;
    }

    this.loading = true;

    const url =
      `${this.apiBase}/auth/register` +
      `?email=${encodeURIComponent(this.email)}` +
      `&role=${encodeURIComponent(this.selectedRole)}`;

    this.http.post<any>(url, {}).subscribe({
      next: (response) => {
        console.log('Registrierung erfolgreich:', response);
        this.message = 'Benutzer wurde erfolgreich angelegt. Sie werden jetzt angemeldet...';

        // Login after registration
        this.auth.loginSimple(this.email).subscribe({
          next: () => {
            this.loading = false;
          },
          error: (err) => {
            console.error('Fehler beim automatischen Login nach Registrierung', err);
            this.loading = false;
            this.error = 'Benutzer wurde angelegt, aber automatischer Login ist fehlgeschlagen. Bitte manuell einloggen.';
            // fallback: zurück zur Login-Seite
            this.router.navigate(['/user-login']);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        console.error('Fehler bei der Registrierung', err);

        if (err.status === 409) {
          this.error = 'Benutzer existiert bereits. Bitte melden Sie sich an.';
        } else if (err.status === 400) {
          this.error = 'Ungültige Eingaben. Bitte E-Mail und Rolle prüfen.';
        } else {
          this.error = 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.';
        }
      }
    });
  }

  cancel() {
    this.router.navigate(['/user-login']);
  }
}
