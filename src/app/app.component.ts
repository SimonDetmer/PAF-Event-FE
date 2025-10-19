import { Component, Inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  dark = false;
  sidenavOpen = true;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') {
      this.dark = saved === 'dark';
    } else {
      this.dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyDarkClass();
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
}
