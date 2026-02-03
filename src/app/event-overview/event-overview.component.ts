import { API_BASE_URL } from '../api.config';
import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { OrderService } from '../order.service';
import { AuthService } from '../auth.service';
import { User } from '../models/user';

@Component({
  selector: 'app-event-overview',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatListModule,
    MatCheckboxModule
  ],
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EventOverviewComponent implements OnInit, OnDestroy {

  user: User | null = null;
  userEmail: string = '';
  userRole: string | null = null;

  events: any[] = [];
  filteredEvents: any[] = [];
  locations: any[] = [];

  loading = false;
  errorMessage = '';

  showPastEvents = false;

  selectedTicketCounts: { [eventId: number]: number } = {};

  newEvent = {
    title: '',
    locationId: null as number | null,
    eventDate: '',
    eventTime: '',
    ticketPrice: null as number | null,
    ticketQuantity: 1 as number | null
  };

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(API_BASE_URL) private readonly apiBase: string,
    private order: OrderService
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        this.userEmail = user?.email ?? '';
        this.userRole = user?.role ?? 'unknown';

        if (!user) {
          this.router.navigate(['/user-login']);
          return;
        }

        this.fetchLocations();
        this.fetchData();

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------------------------------------------
  // LOADING/FILTERING EVENTS
  // ----------------------------------------------------
  fetchData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any[]>(`${this.apiBase}/events`).subscribe({
      next: (events) => {
        this.events = events;
        this.applyFilter();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Fehler beim Laden der Events.';
        this.cdr.markForCheck();
      }
    });
  }

  applyFilter(): void {
    const now = new Date();

    this.filteredEvents = this.events.filter(e => {
      const eventDate = new Date(e.eventDateTime);
      if (this.showPastEvents) {
        return true;
      }
      return eventDate >= now;
    });
  }

  onToggleShowPast(): void {
    this.applyFilter();
  }

  // ----------------------------------------------------
  // LOADING LOCATIONS
  // ----------------------------------------------------
  fetchLocations(): void {
    this.http.get<any[]>(`${this.apiBase}/locations`).subscribe({
      next: locs => {
        this.locations = locs;
        this.cdr.markForCheck();
      },
      error: () => {
        console.error('Fehler beim Laden der Locations');
      }
    });
  }

  getLocationName(locationId: number): string {
    const loc = this.locations.find(l => l.id === locationId);
    if (!loc) {
      return `Location #${locationId}`;
    }

    if (!loc.city) {
      return loc.name;
    }

    return `${loc.name} (${loc.city})`;
  }

  // ----------------------------------------------------
  // CREATE EVENTS
  // ----------------------------------------------------
  createEvent(): void {
    if (this.userRole !== 'eventmanager') {
      alert('Nur Eventmanager können Events erstellen.');
      return;
    }

    if (
      !this.newEvent.title ||
      !this.newEvent.locationId ||
      !this.newEvent.eventDate ||
      !this.newEvent.eventTime ||
      this.newEvent.ticketPrice === null ||
      this.newEvent.ticketQuantity === null
    ) {
      alert('Bitte alle Felder ausfüllen.');
      return;
    }

    const combinedDateTime = `${this.newEvent.eventDate}T${this.newEvent.eventTime}:00`;

    const payload = {
      title: this.newEvent.title,
      locationId: this.newEvent.locationId,
      eventDateTime: combinedDateTime,
      initialTickets: this.newEvent.ticketQuantity,
      ticketPrice: this.newEvent.ticketPrice
    };

    this.http.post(`${this.apiBase}/events`, payload).subscribe({
      next: () => {
        alert('Event erfolgreich erstellt!');
        // Formular zurücksetzen
        this.newEvent = {
          title: '',
          locationId: null,
          eventDate: '',
          eventTime: '',
          ticketPrice: null,
          ticketQuantity: 1
        };
        this.fetchData();
      },
      error: err => {
        console.error(err);
        alert('Event konnte nicht erstellt werden.');
      }
    });
  }

  // ----------------------------------------------------
  // SELECTING TICKETS
  // ----------------------------------------------------
  changeCount(eventId: number, value: string): void {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) {
      this.selectedTicketCounts[eventId] = 0;
    } else {
      this.selectedTicketCounts[eventId] = n;
    }
  }

  hasSelectedTickets(): boolean {
    return Object.values(this.selectedTicketCounts).some(v => v > 0);
  }

  addSelectedTicketsToCart(): void {
    const itemsToAdd = this.filteredEvents
      .map(e => ({
        event: e,
        count: this.selectedTicketCounts[e.id] || 0
      }))
      .filter(x => x.count > 0);

    if (itemsToAdd.length === 0) {
      alert('Bitte mindestens ein Ticket auswählen.');
      return;
    }

    for (const { event, count } of itemsToAdd) {
      this.order.addItem({
        eventId: event.id,
        title: event.title,
        price: event.ticketPrice,
        quantity: count,
        version: event.version,
        availableTickets: event.availableTickets
      });
    }

    this.selectedTicketCounts = {};
    alert('Tickets zum Warenkorb hinzugefügt.');
    this.router.navigate(['/ticket-buy']);
  }

  // ----------------------------------------------------
  // DELETING EVENTS
  // ----------------------------------------------------
  deleteEvent(id: number): void {
    if (this.userRole !== 'eventmanager') {
      alert('Nur Eventmanager können Events löschen.');
      return;
    }

    if (!confirm('Event wirklich löschen?')) return;

    this.http.delete(`${this.apiBase}/events/${id}`).subscribe({
      next: () => {
        alert('Event gelöscht');
        this.fetchData();
      },
      error: () => alert('Fehler beim Löschen')
    });
  }
}
