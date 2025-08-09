import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  selectedRole: string | null = null;

  constructor(private router: Router) {}

  submitRole(): void {
    if (this.selectedRole) {
      this.router.navigate(['/event-overview'], { queryParams: { role: this.selectedRole } });
    } else {
      alert('Bitte wählen Sie eine Rolle aus.');
    }
  }
}
