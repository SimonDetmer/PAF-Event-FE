import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  message = '';

  constructor(private auth: AuthService) {}

  login() {
    this.message = '';

    this.auth.loginSimple(this.email).subscribe({
      next: () => {
        // Weiterleitung passiert bereits im Service
      },
      error: () => {
        this.message = 'Login fehlgeschlagen.';
      }
    });
  }
}
