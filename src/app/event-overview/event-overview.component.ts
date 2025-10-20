import { API_BASE_URL } from '../api.config';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface Ticket {
  id: number;
  price: number;
  order_id: any;
}

interface AppEvent {
  id: number;
  title: string;
  tickets: Ticket[];
  // weitere Eigenschaften
}

@Component({
  selector: 'app-event-overview',
  standalone: true,
  imports: [NgIf, NgForOf, FormsModule, CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatListModule, MatCheckboxModule],
  templateUrl: './event-overview.component.html',
  styleUrls: ['./event-overview.component.css']
})
export class EventOverviewComponent implements OnInit, OnDestroy {
  data: any;
  rawEvents: any[] = [];
  locations: any[] = [];
  tickets: any[] = [];
  userRole: string | null = null;

  newEvent = { title: '', locationId: null, eventDateTime: '' };
  newLocation = { street: '', geoX: null, geoY: null, capacity: null };
  newTicket = { eventId: null, price: null };

  selectedEventIds: number[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(API_BASE_URL) private readonly apiBase: string,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.userRole = params['role'] || 'Unbekannt';
    });
    this.fetchData();
    this.fetchLocations();
    this.fetchTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchData(): void {
    this.http.get<any[]>(`${this.apiBase}/events`).subscribe({
      next: response => {
        this.rawEvents = response;
        const now = new Date();
        this.data = this.userRole !== 'eventmanager'
          ? this.rawEvents.filter((event: any) => new Date(event.eventDateTime) >= now)
          : response;
      },
      error: error => console.error('Fehler beim Abrufen der Events:', error)
    });
  }

  fetchLocations(): void {
    this.http.get<any[]>(`${this.apiBase}/locations`).subscribe({
      next: response => this.locations = response,
      error: error => console.error('Fehler beim Abrufen der Locations:', error)
    });
  }

  fetchTickets(): void {
    this.http.get<any[]>(`${this.apiBase}/tickets`).subscribe({
      next: response => {
        this.tickets = response;
        if (this.userRole !== 'eventmanager') {
          const now = new Date();
          this.data = this.rawEvents.filter((event: any) => new Date(event.eventDateTime) >= now);
        }
      },
      error: error => console.error('Fehler beim Abrufen der Tickets:', error)
    });
  }

  toggleEventSelection(eventId: number, isChecked: boolean): void {
    if (isChecked) {
      if (!this.selectedEventIds.includes(eventId)) {
        this.selectedEventIds.push(eventId);
      }
    } else {
      this.selectedEventIds = this.selectedEventIds.filter(id => id !== eventId);
    }
  }

  orderTickets(): void {
    const selectedEvents = this.data
      .filter((event: any) => this.selectedEventIds.includes(event.id))
      .map((event: any) => {
        const matchingTicket = this.tickets.find(ticket => ticket.event && ticket.event.id === event.id);
        if (matchingTicket) {
          event.ticketPrice = matchingTicket.price;
          event.ticketId = matchingTicket.id;
        }
        return event;
      });
    this.router.navigate(['/ticket-buy'], {
      queryParams: { events: JSON.stringify(selectedEvents) }
    });
  }

  showDashboard(): void {
    this.router.navigate(['/dashboard'], { queryParams: { role: this.userRole } });
  }

  createEvent(): void {
    if (!this.newEvent.title || !this.newEvent.locationId || !this.newEvent.eventDateTime) {
      alert('Bitte füllen Sie alle Felder aus.');
      return;
    }
    const eventData = {
      title: this.newEvent.title,
      location: { id: this.newEvent.locationId },
      eventDateTime: this.newEvent.eventDateTime
    };
    this.http.post(`${this.apiBase}/events`, eventData).subscribe({
      next: () => {
        alert('Event erfolgreich hinzugefügt!');
        this.fetchData();
        this.newEvent = { title: '', locationId: null, eventDateTime: '' };
      },
      error: error => {
        console.error('Fehler beim Erstellen des Events:', error);
        alert('Event konnte nicht hinzugefügt werden.');
      }
    });
  }

  createLocation(): void {
    if (!this.newLocation.street) {
      alert('Bitte geben Sie eine Straße ein.');
      return;
    }
    const locationData = {
      street: this.newLocation.street,
      geoX: this.newLocation.geoX,
      geoY: this.newLocation.geoY,
      capacity: this.newLocation.capacity
    };
    this.http.post(`${this.apiBase}/locations`, locationData).subscribe({
      next: () => {
        alert('Location erfolgreich hinzugefügt!');
        this.fetchLocations();
        this.newLocation = { street: '', geoX: null, geoY: null, capacity: null};
      },
      error: error => {
        console.error('Fehler beim Erstellen der Location:', error);
        alert('Location konnte nicht hinzugefügt werden.');
      }
    });
  }

  createTicket(): void {
    if (!this.newTicket.eventId || this.newTicket.price === null) {
      alert('Bitte wählen Sie ein Event und geben Sie einen Preis ein.');
      return;
    }
    const ticketData = {
      price: this.newTicket.price,
      event: { id: this.newTicket.eventId }
    };
    this.http.post(`${this.apiBase}/tickets`, ticketData).subscribe({
      next: (createdTicket: any) => { // Backend liefert das erstellte Ticket zurück
        alert('Ticket erfolgreich erstellt!');
        this.tickets.push(createdTicket); // Direktes Aktualisieren der Ticketliste
        this.newTicket = { eventId: null, price: null };
        console.log(this.tickets);
      },
      error: error => {
        console.error('Fehler beim Erstellen des Tickets:', error);
        alert('Ticket konnte nicht erstellt werden.');
      }
    });
  }

  getChecked(domEvent: any): boolean {
    return domEvent?.target && (domEvent.target as HTMLInputElement).checked;
  }

  getTicketPrice(item: any): number | null {
    const matchingTicket = this.tickets.find(ticket => ticket.event && ticket.event.id === item.id);
    return matchingTicket ? matchingTicket.price : null;
  }

  get availableTickets(): any[] {
    return this.tickets.filter(ticket => ticket.order_id == null);
  }

  getEventTitle(ticket: any): string {
    const event = this.data?.find((e: AppEvent) =>
      e.tickets && e.tickets.some((t: Ticket) => t.id === ticket.id)
    );
    return event ? event.title : 'Kein Event gefunden';
  }

  deleteEvent(id: number) {
    this.http.delete(`${this.apiBase}/events/${id}`).subscribe({
      next: () => {
        alert('Event erfolgreich gelöscht!');
        this.fetchData();
      },
      error: error => {
        console.error('Fehler beim Löschen des Events:', error);
        alert('Fehler beim Löschen des Events');
      }
    });
  }

  deleteTicket(id: number) {
    this.http.delete(`${this.apiBase}/tickets/${id}`).subscribe({
      next: () => {
        alert('Ticket erfolgreich gelöscht!');
        this.fetchData();
      },
      error: error => {
        console.error('Fehler beim Löschen des Tickets:', error);
        alert('Fehler beim Löschen des Tickets');
      }
    });
  }

  deleteLocation(id: number) {
    this.http.delete(`${this.apiBase}/locations/${id}`).subscribe({
      next: () => {
        alert('Location erfolgreich gelöscht!');
        this.fetchData();
      },
      error: error => {
        console.error('Fehler beim Löschen der Location:', error);
        alert('Fehler beim Löschen der Location');
      }
    });
  }

}
