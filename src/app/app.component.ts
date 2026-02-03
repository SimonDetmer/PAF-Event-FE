import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { DOCUMENT, CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from './order.service';

import { AuthService } from './auth.service';
import { User } from './models/user';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
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
    MatSnackBarModule,
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
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    // Theme handling
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      this.dark = saved === 'dark';
    } else {
      this.dark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkClass();

    // Initial user state
    this.currentUser = this.auth.getCurrentUser();

    if (this.auth.isAuthenticated()) {
      this.auth.loadUserProfile();
    }

    // Subscribe to user changes
    this.userSubscription = this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('User state changed:', user);

      if (!user) {
        const url = this.router.url;
        const isLoginRoute = url.startsWith('/user-login');
        const isCreateUserRoute = url.startsWith('/create-user');

        if (!isLoginRoute && !isCreateUserRoute) {
          this.router.navigate(['/user-login']);
        }
      }
    });
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
    this.userSubscription?.unsubscribe();
  }

  logout(): void {
    this.auth.logout();
    this.dark = false;
    this.applyDarkClass();
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
    return this.currentUser.email?.split('@')[0] || '';
  }
}
