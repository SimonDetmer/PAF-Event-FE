import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {ReportComponent} from '../report/report.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, ReportComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private readonly API_URL = 'http://localhost:8080';
  userRole: string | null = null;
  events: any[] = [];
  tickets: any[] = [];
  sortedEvents: any[] = [];
  // Nur noch E-Mail in der Kundenformular-Objekt
  customerForm = { email: '' };
  customerUser: any = null;
  customerOrders: any[] = [];
  customerEvents: any[] = [];
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      this.userRole = params['role'] || 'Unbekannt';
    });
  }

  ngOnInit(): void {
    if (this.userRole === 'eventmanager') {
      this.loadData();
    }
  }

  loadData(): void {
    forkJoin({
      events: this.http.get<any[]>(`${this.API_URL}/events`),
      tickets: this.http.get<any[]>(`${this.API_URL}/tickets`)
    }).subscribe(({ events, tickets }) => {
      this.events = events;
      this.tickets = tickets;
      this.sortedEvents = [...this.events].sort((a, b) =>
        new Date(a.eventDateTime).getTime() - new Date(b.eventDateTime).getTime()
      );
    });
  }

  getSoldTicketsForEvent(event: any): any[] {
    return event.tickets && event.tickets.length
      ? event.tickets.filter((ticket: any) => ticket.order_id != null)
      : this.tickets.filter(ticket =>
        ticket.order_id != null &&
        ticket.event && ticket.event.id === event.id
      );
  }

  getTotalForEvent(event: any): number {
    return this.getSoldTicketsForEvent(event).reduce((sum: number, ticket: any) => sum + ticket.price, 0);
  }

  getOverallTotal(): number {
    return this.tickets.filter(ticket => ticket.order_id != null)
      .reduce((sum: number, ticket: any) => sum + ticket.price, 0);
  }

  loadCustomerData(): void {
    this.errorMessage = '';
    this.customerUser = null;
    this.customerOrders = [];
    this.customerEvents = [];

    // Suche den Kunden ausschließlich anhand der E-Mail
    this.http.get<any[]>(`${this.API_URL}/users`).subscribe(users => {
      const foundUser = users.find(u =>
        u.email.trim() === this.customerForm.email.trim()
      );
      if (!foundUser) {
        this.errorMessage = 'Kein Benutzer gefunden. Bitte überprüfen Sie Ihre Eingaben oder registrieren Sie sich.';
        return;
      }
      this.customerUser = foundUser;
      if (foundUser.orders && foundUser.orders.length) {
        this.customerOrders = foundUser.orders;
        this.loadEventsAndProcessOrders();
      } else {
        this.errorMessage = 'Für diesen Benutzer wurden keine Orders gefunden.';
      }
    }, () => {
      this.errorMessage = 'Fehler beim Laden der Benutzerdaten.';
    });
  }

  loadEventsAndProcessOrders(): void {
    this.http.get<any[]>(`${this.API_URL}/events`).subscribe(events => {
      const ticketIdToEvent = events.reduce((acc: { [ticketId: number]: any }, event: any) => {
        if (event.tickets && event.tickets.length) {
          event.tickets.forEach((ticket: any) => {
            acc[ticket.id] = event;
          });
        }
        return acc;
      }, {});
      this.customerOrders.forEach(order => {
        order.tickets?.forEach((ticket: any) => {
          if (!ticket.event && ticketIdToEvent[ticket.id]) {
            ticket.event = ticketIdToEvent[ticket.id];
          }
        });
      });
      this.groupCustomerEvents();
    });
  }

  groupCustomerEvents(): void {
    const eventMap = this.customerOrders.reduce((map: { [key: string]: any }, order: any) => {
      order.tickets?.forEach((ticket: any) => {
        if (ticket.event) {
          const eventId = ticket.event.id;
          if (!map[eventId]) {
            map[eventId] = { event: ticket.event, count: 0, total: 0 };
          }
          map[eventId].count++;
          map[eventId].total += ticket.price;
        }
      });
      return map;
    }, {});
    this.customerEvents = Object.values(eventMap).sort((a: any, b: any) =>
      new Date(a.event.eventDateTime).getTime() - new Date(b.event.eventDateTime).getTime()
    );
  }

  getCustomerOverallTotal(): number {
    return this.customerEvents.reduce((sum: number, item: any) => sum + item.total, 0);
  }
}
