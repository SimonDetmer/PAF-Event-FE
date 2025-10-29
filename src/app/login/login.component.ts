import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  selectedRole: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  submitRole(): void {
    if (this.selectedRole) {
      const role = (this.selectedRole === 'eventmanager' ? 'eventmanager' : 'customer') as 'eventmanager' | 'customer';
      this.auth.loginWithRole(role);
      this.router.navigate(['/event-overview']);
    } else {
      alert('Bitte wählen Sie eine Rolle aus.');
    }
  }

  goToCreateUser(): void {
    this.router.navigate(['/create-user']);
  }

  goToUserLogin(): void {
    this.router.navigate(['/user-login']);
  }
}
