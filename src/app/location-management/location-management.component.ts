import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { API_BASE_URL } from '../api.config';
import { AuthService } from '../auth.service';
import { User } from '../models/user';

@Component({
  selector: 'app-location-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule
  ],
  templateUrl: './location-management.component.html',
  styleUrls: ['./location-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LocationManagementComponent implements OnInit {

  user: User | null = null;
  locations: any[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  displayedColumns: string[] = ['id', 'name', 'city', 'capacity', 'actions'];

  newLocation = {
    name: '',
    city: '',
    capacity: null as number | null
  };

  private apiBase = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiBase = apiBaseUrl;
  }

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.user = user;

      if (!user) {
        this.router.navigate(['/user-login']);
        return;
      }

      if (user.role !== 'eventmanager') {
        this.errorMessage = 'Keine Berechtigung: Nur Eventmanager können Locations verwalten.';
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/dashboard']), 1500);
        return;
      }

      this.loadLocations();
    });
  }

  // ----------------------------------------------------
  // LOAD LOCATIONS
  // ----------------------------------------------------
  loadLocations(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.get<any[]>(`${this.apiBase}/locations`).subscribe({
      next: (data) => {
        this.locations = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Fehler beim Laden der Locations', err);
        this.loading = false;
        this.errorMessage = 'Locations konnten nicht geladen werden.';
        this.cdr.markForCheck();
      }
    });
  }

  // ----------------------------------------------------
  // CREATE LOCATION
  // ----------------------------------------------------
  createLocation(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newLocation.name) {
      this.errorMessage = 'Bitte einen Namen für die Location angeben.';
      return;
    }

    if (!this.newLocation.city) {
      this.errorMessage = 'Bitte einen Ort für die Location angeben.';
      return;
    }

    const capacity = this.newLocation.capacity ?? 0;

    this.loading = true;

    const payload: any = {
      name: this.newLocation.name,
      city: this.newLocation.city,
      capacity: capacity
    };

    this.http.post<any>(`${this.apiBase}/locations`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Location erfolgreich erstellt.';
        this.newLocation = { name: '', city: '', capacity: null };
        this.loadLocations();
      },
      error: (err) => {
        this.loading = false;
        console.error('Fehler beim Erstellen der Location', err);
        this.errorMessage =
          'Location konnte nicht erstellt werden. Bitte Eingaben prüfen (Pflichtfelder, Wertebereiche).';
        this.cdr.markForCheck();
      }
    });
  }

  // ----------------------------------------------------
  // DELETE LOCATION
  // ----------------------------------------------------
  deleteLocation(loc: any): void {
    if (!confirm(`Location "${loc.name || loc.id}" wirklich löschen?`)) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`${this.apiBase}/locations/${loc.id}`).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Location gelöscht.';
        this.loadLocations();
      },
      error: (err) => {
        this.loading = false;
        console.error('Fehler beim Löschen der Location', err);
        this.errorMessage = 'Location konnte nicht gelöscht werden.';
        this.cdr.markForCheck();
      }
    });
  }
}
