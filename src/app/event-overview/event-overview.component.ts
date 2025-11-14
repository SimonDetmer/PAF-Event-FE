import { API_BASE_URL } from '../api.config';
import { Component, OnInit, OnDestroy, Inject, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
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

interface AppEvent {
  id: number;
  title: string;
  locationId?: number;
  eventDateTime: string;
  availableTickets: number;
  version: number;
  ticketPrice: number;
}

@Component({
  selector: 'app-event-overview',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
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
  encapsulation: ViewEncapsulation.None
})
export class EventOverviewComponent implements OnInit, OnDestroy {

  data: AppEvent[] = [];
  rawEvents: AppEvent[] = [];
  locations: any[] = [];

  userRole: string | null = null;
  userEmail: string = '';

  selectedTicketCounts: { [eventId: number]: number } = {};

  newEvent = {
    title: '',
    locationId: null as number | null,
    eventDate: '',
    eventTime: '',
    ticketPrice: null as number | null,
    ticketQuantity: 1
  };

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(API_BASE_URL) private readonly apiBase: string,
    private order: OrderService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.userRole = params['role'] || 'Unbekannt';
    });

    this.fetchLocations();
    this.fetchData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // -----------------------------
  // LOAD EVENTS
  // -----------------------------
  fetchData(): void {
    this.http.get<AppEvent[]>(`${this.apiBase}/events`).subscribe({
      next: events => {
        this.rawEvents = events;

        const now = new Date();
        this.data = this.userRole !== 'eventmanager'
          ? events.filter(e => new Date(e.eventDateTime) >= now)
          : events;
      },
      error: () => alert('Fehler beim Laden der Events.')
    });
  }

  // -----------------------------
  // LOAD LOCATIONS
  // -----------------------------
  fetchLocations(): void {
    this.http.get<any[]>(`${this.apiBase}/locations`).subscribe({
      next: locs => this.locations = locs,
      error: () => console.error('Fehler beim Laden der Locations')
    });
  }

  // -----------------------------
  // CREATE EVENT  ← **JETZT WIEDER DRIN!!!**
  // -----------------------------
  createEvent(): void {
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
        this.fetchData();
      },
      error: err => {
        console.error(err);
        alert('Event konnte nicht erstellt werden.');
      }
    });
  }

  // -----------------------------
  // UPDATE TICKET COUNT
  // -----------------------------
  updateTicketCount(eventId: number, ev: any): void {
    const qty = Number(ev.target.value);
    this.selectedTicketCounts[eventId] = Math.max(0, qty);
  }

  hasSelectedTickets(): boolean {
    return Object.values(this.selectedTicketCounts).some(v => v > 0);
  }

  // -----------------------------
  // ADD TO CART
  // -----------------------------
  addToCart(): void {
    for (const e of this.data) {
      const qty = this.selectedTicketCounts[e.id] || 0;

      if (qty > 0) {
        if (qty > e.availableTickets) {
          alert(`Nicht genug Tickets für ${e.title}`);
          return;
        }

        this.order.addItem({
          eventId: e.id,
          title: e.title,
          price: e.ticketPrice,
          quantity: qty,
          availableTickets: e.availableTickets,
          version: e.version
        });
      }
    }

    this.router.navigate(['/ticket-buy']);
  }

  // -----------------------------
  // DELETE EVENT  ← wieder drin
  // -----------------------------
  deleteEvent(id: number): void {
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
