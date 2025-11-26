import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css'],
})
export class UserLoginComponent {

  email: string = '';
  loading = false;
  message = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  login() {
    this.error = '';
    this.message = '';

    if (!this.email) {
      this.error = 'Bitte E-Mail eingeben.';
      return;
    }

    this.loading = true;

    this.auth.loginSimple(this.email).subscribe({
      next: () => {
        this.loading = false;
        // Weiterleitung macht bereits der AuthService (router.navigate(['/dashboard']))
        this.message = 'Erfolgreich angemeldet.';
      },
      error: (err) => {
        console.error('Login-Fehler', err);
        this.loading = false;

        if (err.status === 404 || err.status === 400) {
          this.error = 'Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.';
        } else {
          this.error = 'Login fehlgeschlagen. Bitte später erneut versuchen.';
        }
      }
    });
  }

  goToRegister() {
    // WICHTIG: Kein window.location – sondern Angular-Router nutzen
    this.router.navigate(['/create-user']);
  }
}
