import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ReportComponent } from '../report/report.component';
import { API_BASE_URL } from '../api.config';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { AuthService, User } from '../auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, MatButtonModule, MatTableModule, ReportComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  private destroy$ = new Subject<void>();
  events: any[] = [];
  tickets: any[] = [];
  sortedEvents: any[] = [];
  // Nur noch E-Mail in der Kundenformular-Objekt
  customerForm = { email: '' };
  customerUser: any = null;
  customerOrders: any[] = [];
  customerEvents: any[] = [];
  errorMessage: string = '';
  displayedColumnsManager: string[] = ['id', 'title', 'date', 'sold', 'price', 'total'];
  displayedColumnsCustomer: string[] = ['eventId', 'title', 'date', 'count', 'price', 'total'];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    @Inject(API_BASE_URL) private readonly apiBase: string,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;
        if (user) {
          this.customerForm.email = user.email;
          if (user.role === 'eventmanager') {
            this.loadData();
          } else {
            this.loadCustomerData();
          }
        } else {
          this.router.navigate(['/login']);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    forkJoin({
      events: this.http.get<any[]>(`${this.apiBase}/events`),
      tickets: this.http.get<any[]>(`${this.apiBase}/tickets`)
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
    this.customerUser = this.user; // Use the authenticated user
    this.customerOrders = [];
    this.customerEvents = [];

    if (!this.user) {
      this.errorMessage = 'Kein Benutzer angemeldet.';
      return;
    }

    // Load user data including orders
    this.http.get<any[]>(`${this.apiBase}/users`).subscribe(users => {
      const foundUser = users.find(u => 
        String(u.email ?? '').trim().toLowerCase() === String(this.user?.email ?? '').trim().toLowerCase()
      );
      
      if (!foundUser) {
        this.errorMessage = 'Benutzerdaten konnten nicht geladen werden.';
        return;
      }
      
      this.customerUser = foundUser;
      
      if (foundUser.orders && foundUser.orders.length) {
        this.customerOrders = foundUser.orders;
        this.loadEventsAndProcessOrders();
      } else {
        this.errorMessage = 'Keine Bestellungen für diesen Benutzer gefunden.';
      }
    }, () => {
      this.errorMessage = 'Fehler beim Laden der Benutzerdaten.';
    });
  }

  loadEventsAndProcessOrders(): void {
    this.http.get<any[]>(`${this.apiBase}/events`).subscribe(events => {
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
