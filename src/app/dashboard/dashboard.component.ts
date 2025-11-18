import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Inject
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { forkJoin, Subject, takeUntil, Observable } from 'rxjs';

import { ReportComponent } from '../report/report.component';
import { API_BASE_URL } from '../api.config';

import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '../auth.service';
import { User } from '../models/user';

import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule,
    MatCardModule,
    NgxEchartsDirective,
    ReportComponent
  ],
  providers: [
    provideEchartsCore({
      echarts: () => import('echarts/core')
    })
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

  user: User | null = null;

  private destroy$ = new Subject<void>();

  events: any[] = [];
  tickets: any[] = [];
  sortedEvents: any[] = [];

  customerForm = { email: '' };
  customerUser: any = null;
  customerOrders: any[] = [];
  customerEvents: any[] = [];
  errorMessage: string = '';

  displayedColumnsManager = ['id', 'title', 'date', 'sold', 'price', 'total'];
  displayedColumnsCustomer = ['eventId', 'title', 'date', 'count', 'price', 'total'];

  // Charts
  salesByEventChart: EChartsOption = {};
  revenueDistributionChart: EChartsOption = {};
  salesOverTimeChart: EChartsOption = {};
  customerDistributionChart: EChartsOption = {};
  customerSpendingChart: EChartsOption = {};

  private apiBase = '';
  private user$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    @Inject(API_BASE_URL) apiBaseUrl: string
  ) {
    this.apiBase = apiBaseUrl;
    this.user$ = this.authService.currentUser$;
  }

  // ----------------------------------------------------
  // INIT
  // ----------------------------------------------------
  ngOnInit(): void {
    this.user$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.user = user;

        if (!user) {
          this.router.navigate(['/user-login']);
          return;
        }

        if (user.role === 'eventmanager') {
          this.loadData();
        } else {
          this.loadCustomerData();
        }

        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ----------------------------------------------------
  // MANAGER VIEW DATA
  // ----------------------------------------------------
  loadData(): void {
    forkJoin({
      events: this.http.get<any[]>(`${this.apiBase}/events`),
      tickets: this.http.get<any[]>(`${this.apiBase}/tickets`)
    }).subscribe(({ events, tickets }) => {
      this.events = events;
      this.tickets = tickets;

      this.sortedEvents = [...this.events].sort(
        (a, b) =>
          new Date(a.eventDateTime).getTime() -
          new Date(b.eventDateTime).getTime()
      );

      this.prepareManagerCharts();
      this.cdr.markForCheck();
    });
  }

  getSoldTicketsForEvent(event: any): any[] {
    return event.tickets?.filter((ticket: any) => ticket.order_id != null)
      ?? this.tickets.filter(
        (ticket: any) =>
          ticket.order_id != null &&
          ticket.event &&
          ticket.event.id === event.id
      );
  }

  getTotalForEvent(event: any): number {
    return this.getSoldTicketsForEvent(event).reduce(
      (sum: number, ticket: any) => sum + ticket.price,
      0
    );
  }

  getOverallTotal(): number {
    return this.tickets
      .filter((t: any) => t.order_id != null)
      .reduce((sum: number, t: any) => sum + t.price, 0);
  }

  // ----------------------------------------------------
  // CUSTOMER VIEW DATA
  // ----------------------------------------------------
  private loadCustomerData(): void {
    this.errorMessage = '';
    this.customerUser = this.user;
    this.customerOrders = [];
    this.customerEvents = [];

    if (!this.user) {
      this.errorMessage = 'Kein Benutzer angemeldet.';
      return;
    }

    this.http.get<any[]>(`${this.apiBase}/users`).subscribe(users => {
      const found = users.find(u =>
        String(u.email).trim().toLowerCase() ===
        String(this.user?.email).trim().toLowerCase()
      );

      if (!found) {
        this.errorMessage = 'Benutzerdaten konnten nicht geladen werden.';
        return;
      }

      this.customerUser = found;
      this.customerOrders = found.orders || [];

      if (this.customerOrders.length === 0) {
        this.errorMessage = 'Keine Bestellungen gefunden.';
        return;
      }

      this.loadEventsAndProcessOrders();
    });
  }

  private loadEventsAndProcessOrders(): void {
    this.http.get<any[]>(`${this.apiBase}/events`).subscribe(events => {

      const ticketMap: { [id: number]: any } = {};

      events.forEach(ev => {
        ev.tickets?.forEach((ticket: any) => {
          ticketMap[ticket.id] = ev;
        });
      });

      this.customerOrders.forEach(order => {
        order.tickets?.forEach((ticket: any) => {
          if (!ticket.event) {
            ticket.event = ticketMap[ticket.id];
          }
        });
      });

      this.groupCustomerEvents();
      this.cdr.markForCheck();
    });
  }

  private groupCustomerEvents(): void {
    const map: { [eventId: number]: any } = {};

    this.customerOrders.forEach(order => {
      order.tickets?.forEach((ticket: any) => {

        if (!ticket.event) return;

        const id = ticket.event.id;

        if (!map[id]) {
          map[id] = {
            event: ticket.event,
            count: 0,
            total: 0
          };
        }

        map[id].count++;
        map[id].total += ticket.price;
      });
    });

    this.customerEvents = Object.values(map).sort(
      (a: any, b: any) =>
        new Date(a.event.eventDateTime).getTime() -
        new Date(b.event.eventDateTime).getTime()
    );

    this.prepareCustomerCharts();
    this.cdr.markForCheck();
  }

  getCustomerOverallTotal(): number {
    return this.customerEvents.reduce(
      (sum: number, e: any) => sum + e.total,
      0
    );
  }

  getTotalTicketCount(): number {
    return this.customerEvents.reduce(
      (sum: number, e: any) => sum + e.count,
      0
    );
  }

  // ----------------------------------------------------
  // MANAGER CHARTS
  // ----------------------------------------------------
  private prepareManagerCharts(): void {
    if (this.sortedEvents.length === 0) return;

    this.salesByEventChart = {
      title: { text: 'Ticket Sales by Event', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: this.sortedEvents.map(e => e.title),
        axisLabel: { rotate: 30 }
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Tickets Sold',
          type: 'bar',
          data: this.sortedEvents.map(e => this.getSoldTicketsForEvent(e).length)
        }
      ]
    };

    const revenueData = this.sortedEvents.map(e => ({
      value: this.getTotalForEvent(e),
      name: e.title
    }));

    this.revenueDistributionChart = {
      title: { text: 'Revenue Distribution', left: 'center' },
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: revenueData
        }
      ]
    };

    const dateMap = new Map<string, number>();

    this.tickets.forEach((ticket: any) => {
      if (ticket.order_id) {
        const d = new Date(ticket.createdAt).toISOString().split('T')[0];
        dateMap.set(d, (dateMap.get(d) || 0) + 1);
      }
    });

    const sortedDates = Array.from(dateMap.keys()).sort();

    this.salesOverTimeChart = {
      title: { text: 'Sales Over Time', left: 'center' },
      xAxis: { type: 'category', data: sortedDates },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'line',
          data: sortedDates.map(d => dateMap.get(d))
        }
      ]
    };
  }

  // ----------------------------------------------------
  // CUSTOMER CHARTS
  // ----------------------------------------------------
  private prepareCustomerCharts(): void {
    if (this.customerEvents.length === 0) return;

    this.customerDistributionChart = {
      title: { text: 'Your Ticket Distribution', left: 'center' },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: this.customerEvents.map(e => ({
            value: e.count,
            name: e.event.title
          }))
        }
      ]
    };

    this.customerSpendingChart = {
      title: { text: 'Your Spending by Event', left: 'center' },
      xAxis: {
        type: 'category',
        data: this.customerEvents.map(e => e.event.title)
      },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: this.customerEvents.map(e => e.total)
        }
      ]
    };
  }
}
