import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { DOCUMENT, CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';
import { UserService, User } from './user.service';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSidenavModule, 
    MatListModule, 
    MatBadgeModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  dark = false;
  sidenavOpen = true;
  currentUser: User | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document, 
    private router: Router, 
    public order: OrderService, 
    private auth: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Theme setup
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      this.dark = saved === 'dark';
    } else {
      this.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkClass();

    // Subscribe to user changes
    this.userSubscription = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Load current user if authenticated
    if (this.auth.isAuthenticated() && !this.currentUser) {
      const userId = this.auth.getUserId();
      if (userId) {
        this.userService.getUserById(userId).subscribe({
          error: (error) => {
            console.error('Failed to load user data:', error);
            // If we can't load the user, log them out
            this.logout();
          }
        });
      }
    }
  }

  toggleDarkMode(): void {
    this.dark = !this.dark;
    localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    this.applyDarkClass();
  }

  toggleSidenav(): void {
    this.sidenavOpen = !this.sidenavOpen;
  }

  private applyDarkClass(): void {
    const rootEl = this.document.documentElement;
    if (this.dark) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  logout(): void {
    // Clear theme preference
    localStorage.removeItem('theme');
    this.dark = false;
    this.applyDarkClass();
    this.sidenavOpen = false;
    
    // Clear auth and user data
    this.auth.logout();
    this.userService.clearUser();
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  get orderCount(): number {
    return this.order.getTotalCount();
  }

  get userRole(): string {
    return this.currentUser?.role || '';
  }

  get userEmail(): string | undefined {
    return this.currentUser?.email;
  }
  
  get userName(): string {
    if (!this.currentUser) return '';
    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }
    return this.currentUser.email.split('@')[0];
  }
}
