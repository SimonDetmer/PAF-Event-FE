import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {

  email = '';
  message = '';

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.logout();
  }

  login() {
    this.message = '';

    this.auth.loginSimple(this.email).subscribe({
      next: () => {
      },
      error: () => {
        this.message = 'Login fehlgeschlagen.';
      }
    });
  }
}
