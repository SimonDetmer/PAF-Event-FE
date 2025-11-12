import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  constructor(private router: Router) {}

  goToCreateUser(): void {
    this.router.navigate(['/create-user']);
  }

  goToUserLogin(): void {
    this.router.navigate(['/user-login']);
  }
}
