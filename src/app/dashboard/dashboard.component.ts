import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject, takeUntil, Observable } from 'rxjs';
import { ReportComponent } from '../report/report.component';
import { API_BASE_URL } from '../api.config';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { AuthService, User } from '../auth.service';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';

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
  providers: [provideEchartsCore({ echarts: () => import('echarts/core') })],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
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
  displayedColumnsManager: string[] = ['id', 'title', 'date', 'sold', 'price', 'total'];
  displayedColumnsCustomer: string[] = ['eventId', 'title', 'date', 'count', 'price', 'total'];
  
  // Chart options
  salesByEventChart: EChartsOption = {};
  revenueDistributionChart: EChartsOption = {};
  salesOverTimeChart: EChartsOption = {};
  customerDistributionChart: EChartsOption = {};
  customerSpendingChart: EChartsOption = {};

  private apiBase = '';
  private user$: Observable<User | null>;
  
  // Register ECharts modules
  // Initialize ECharts with the required modules
  private readonly echarts = echarts;

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

  ngOnInit(): void {
    this.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      this.user = user;
      if (user) {
        if (user.role === 'eventmanager') {
          this.loadData();
        } else if (user.role === 'customer') {
          this.loadCustomerData();
        }
      } else {
        this.router.navigate(['/login']);
      }
      this.cdr.markForCheck();
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
      this.prepareManagerCharts();
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

  private async loadCustomerData(): Promise<void> {
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
    this.prepareCustomerCharts();
  }

  getCustomerOverallTotal(): number {
    return this.customerEvents.reduce((sum: number, item: any) => sum + item.total, 0);
  }

  getTotalTicketCount(): number {
    return this.customerEvents.reduce((sum: number, item: any) => sum + item.count, 0);
  }

  // Prepare charts for manager view
  private prepareManagerCharts(): void {
    // Only prepare charts if we have data
    if (this.sortedEvents.length === 0) {
      return;
    }
    // Sales by event chart
    this.salesByEventChart = {
      title: {
        text: 'Ticket Sales by Event',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: this.sortedEvents.map(event => event.title),
        axisLabel: {
          rotate: 30,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Tickets Sold'
      },
      series: [{
        name: 'Tickets Sold',
        type: 'bar',
        data: this.sortedEvents.map(event => this.getSoldTicketsForEvent(event).length),
        itemStyle: {
          color: '#3f51b5'
        }
      }]
    };

    // Revenue distribution pie chart
    const revenueData = this.sortedEvents.map(event => ({
      value: this.getTotalForEvent(event),
      name: event.title
    }));

    this.revenueDistributionChart = {
      title: {
        text: 'Revenue Distribution',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: €{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: 'Revenue',
          type: 'pie',
          radius: '50%',
          data: revenueData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    // Sales over time line chart
    const dateMap = new Map<string, number>();
    this.tickets.forEach(ticket => {
      if (ticket.order_id) {
        const date = new Date(ticket.createdAt || Date.now()).toISOString().split('T')[0];
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });

    const sortedDates = Array.from(dateMap.keys()).sort();
    const salesData = sortedDates.map(date => dateMap.get(date) || 0);

    this.salesOverTimeChart = {
      title: {
        text: 'Sales Over Time',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: sortedDates
      },
      yAxis: {
        type: 'value',
        name: 'Tickets Sold'
      },
      series: [
        {
          name: 'Tickets Sold',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: {
            width: 0
          },
          showSymbol: false,
          areaStyle: {
            opacity: 0.8,
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(63, 81, 181, 0.8)' },
              { offset: 1, color: 'rgba(63, 81, 181, 0.1)' }
            ])
          },
          emphasis: {
            focus: 'series'
          },
          data: salesData
        }
      ]
    };
  }

  // Prepare charts for customer view
  private prepareCustomerCharts(): void {
    // Only prepare charts if we have data
    if (this.customerEvents.length === 0) {
      return;
    }
    // Customer ticket distribution
    this.customerDistributionChart = {
      title: {
        text: 'Your Ticket Distribution',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: 'Tickets',
          type: 'pie',
          radius: '50%',
          data: this.customerEvents.map(item => ({
            value: item.count,
            name: item.event.title
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };

    // Customer spending by event
    this.customerSpendingChart = {
      title: {
        text: 'Your Spending by Event',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>Total: €${data.value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: this.customerEvents.map(item => item.event.title),
        axisLabel: {
          rotate: 30,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: 'Amount (€)'
      },
      series: [
        {
          name: 'Spending',
          type: 'bar',
          data: this.customerEvents.map(item => ({
            value: item.total,
            itemStyle: {
              color: item.total > 100 ? '#4caf50' : '#ff9800'
            }
          })),
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          }
        }
      ]
    };
  }
}
