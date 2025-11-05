import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { User } from '../user.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  selectedRole: string | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router, 
    private auth: AuthService,
    private userService: UserService
  ) {}

  submitRole(): void {
    if (!this.selectedRole) {
      this.error = 'Bitte wählen Sie eine Rolle aus.';
      return;
    }

    this.loading = true;
    this.error = null;

    // For demo purposes, create a mock user
    const mockUser: User = {
      id: Date.now(),
      email: `demo-${this.selectedRole}@example.com`,
      role: this.selectedRole as 'eventmanager' | 'customer',
      firstName: 'Demo',
      lastName: this.selectedRole === 'eventmanager' ? 'Manager' : 'User'
    };

    // In a real app, you would call your backend to authenticate
    setTimeout(() => {
      try {
        this.userService.setCurrentUser(mockUser);
        this.auth.login(mockUser);
        this.router.navigate(['/event-overview']);
      } catch (error) {
        console.error('Login error:', error);
        this.error = 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.';
      } finally {
        this.loading = false;
      }
    }, 500);
  }

  goToCreateUser(): void {
    this.router.navigate(['/create-user']);
  }

  goToUserLogin(): void {
    this.router.navigate(['/user-login']);
  }
}
