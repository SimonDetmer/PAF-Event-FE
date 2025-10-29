import { Component, Inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { DOCUMENT, CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { OrderService } from './order.service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule, MatBadgeModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  dark = false;
  sidenavOpen = true;

  constructor(@Inject(DOCUMENT) private readonly document: Document, private router: Router, public order: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      this.dark = saved === 'dark';
    } else {
      this.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkClass();
    // If authenticated, remain on current route; otherwise redirect happens via guard
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

  logout(): void {
    // Optional: clear any session-like state
    localStorage.removeItem('theme');
    this.dark = false;
    this.applyDarkClass();
    this.sidenavOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  get orderCount(): number {
    return this.order.getTotalCount();
  }

  get userRole(): string {
    return this.auth.getRole();
  }

  get userEmail(): string | undefined {
    return this.auth.getEmail();
  }
}
