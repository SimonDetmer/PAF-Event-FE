import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  TitleComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsCoreOption } from 'echarts';

import { API_BASE_URL } from '../api.config';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
  TitleComponent,
  CanvasRenderer
]);

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  providers: [provideEchartsCore({ echarts })]
})
export class ReportComponent implements OnInit, AfterViewInit {
  chartOption1: EChartsCoreOption = {}; // Ticket Sales Over Time (Line)
  chartOption2: EChartsCoreOption = {}; // Ticket Sales Per Event (Bar)
  chartOption3: EChartsCoreOption = {}; // Revenue Distribution (Pie)
  chartOption4: EChartsCoreOption = {}; // Booking Heatmap (Heatmap)
  chartOption5: EChartsCoreOption = {}; // Location Occupancy (Bar)

  private heatmapInitialized = false;

  // Live-Daten
  private events: any[] = [];
  private tickets: any[] = [];
  private locations: any[] = [];

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBase: string
  ) {}

  ngOnInit() {
    // Live laden statt Dummy chartData
    this.loadLiveReportData();
  }

  ngAfterViewInit() {
    setTimeout(() => this.initHeatmap(), 100);
  }

  // ----------------------------------------------------
  // Helper: hide ECharts titles (like dashboard)
  // ----------------------------------------------------
  private hideChartTitle(option: EChartsCoreOption): EChartsCoreOption {
    const title: any = (option as any).title;
    if (!title) return option;

    const hiddenTitle = Array.isArray(title)
      ? title.map((t: any) => ({ ...t, show: false }))
      : { ...title, show: false };

    return { ...(option as any), title: hiddenTitle } as EChartsCoreOption;
  }

  // ----------------------------------------------------
  // Load live data from backend
  // ----------------------------------------------------
  private loadLiveReportData(): void {
    forkJoin({
      events: this.http.get<any[]>(`${this.apiBase}/events`),
      tickets: this.http.get<any[]>(`${this.apiBase}/tickets`),
      locations: this.http.get<any[]>(`${this.apiBase}/locations`)
    }).subscribe({
      next: ({ events, tickets, locations }) => {
        this.events = events ?? [];
        this.tickets = tickets ?? [];
        this.locations = locations ?? [];

        this.initChartOptionsFromLiveData();

        // Heatmap needs a small refresh after DOM paint (ngx-echarts quirk)
        setTimeout(() => this.initHeatmap(), 100);
      },
      error: (err) => {
        console.error('Failed to load report data', err);
        // Fallback: show empty charts rather than crashing
        this.chartOption1 = {};
        this.chartOption2 = {};
        this.chartOption3 = {};
        this.chartOption4 = {};
        this.chartOption5 = {};
      }
    });
  }

  // ----------------------------------------------------
  // Heatmap re-init (unchanged idea from your code)
  // ----------------------------------------------------
  private initHeatmap() {
    if (!this.heatmapInitialized) {
      this.chartOption4 = { ...this.chartOption4 };
      this.heatmapInitialized = true;
    }
  }

  // ----------------------------------------------------
  // Build charts from LIVE tickets/events/locations
  // ----------------------------------------------------
  private initChartOptionsFromLiveData(): void {
    // We only consider "sold" tickets (your dashboard logic: orderId != null)
    const soldTickets = this.tickets.filter((t: any) => t?.orderId != null);

    // === Chart 1: Ticket Sales Over Time (Line) ===
    const dateMap = new Map<string, number>();
    for (const t of soldTickets) {
      const d = this.safeDateOnly(t?.createdAt);
      if (!d) continue;
      dateMap.set(d, (dateMap.get(d) || 0) + 1);
    }
    const dates = Array.from(dateMap.keys()).sort();
    const counts = dates.map(d => dateMap.get(d) || 0);

    this.chartOption1 = this.hideChartTitle({
      // title would be redundant – heading belongs in HTML
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ data: counts, type: 'line', smooth: true }]
    });

    // === Chart 2: Ticket Sales Per Event (Bar) ===
    const eventTitleById = new Map<number, string>();
    for (const e of this.events) eventTitleById.set(e.id, e.title);

    const perEvent = new Map<number, number>();
    for (const t of soldTickets) {
      const eid = t?.eventId;
      if (typeof eid !== 'number') continue;
      perEvent.set(eid, (perEvent.get(eid) || 0) + 1);
    }

    const perEventEntries = Array.from(perEvent.entries())
      .map(([eventId, ticketCount]) => ({
        eventId,
        eventTitle: eventTitleById.get(eventId) || `Event #${eventId}`,
        ticketCount
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount);

    this.chartOption2 = this.hideChartTitle({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: perEventEntries.map(e => e.eventTitle) },
      yAxis: { type: 'value' },
      series: [{ data: perEventEntries.map(e => e.ticketCount), type: 'bar' }]
    });

    // === Chart 3: Revenue Distribution (Pie) ===
    const revenueByEvent = new Map<number, number>();
    for (const t of soldTickets) {
      const eid = t?.eventId;
      const price = Number(t?.price ?? 0);
      if (typeof eid !== 'number') continue;
      revenueByEvent.set(eid, (revenueByEvent.get(eid) || 0) + price);
    }

    const pieData = Array.from(revenueByEvent.entries())
      .map(([eventId, totalRevenue]) => ({
        value: totalRevenue,
        name: eventTitleById.get(eventId) || `Event #${eventId}`
      }))
      .sort((a, b) => (b.value as number) - (a.value as number));

    this.chartOption3 = this.hideChartTitle({
      tooltip: { trigger: 'item' },
      series: [{
        name: 'Total Revenue',
        type: 'pie',
        radius: '50%',
        data: pieData,
        label: { formatter: '{b}: {d}%' }
      }]
    });

    // === Chart 5: Location Occupancy (Bar) ===
    // We compute sold tickets per location via event.locationId
    const locationById = new Map<number, any>();
    for (const l of this.locations) locationById.set(l.id, l);

    const eventById = new Map<number, any>();
    for (const e of this.events) eventById.set(e.id, e);

    const soldByLocation = new Map<number, number>();
    for (const t of soldTickets) {
      const ev = eventById.get(t?.eventId);
      const locId = ev?.locationId;
      if (typeof locId !== 'number') continue;
      soldByLocation.set(locId, (soldByLocation.get(locId) || 0) + 1);
    }

    const occupancy = Array.from(soldByLocation.entries())
      .map(([locationId, ticketCount]) => {
        const loc = locationById.get(locationId);
        const capacity = Number(loc?.capacity ?? 0) || 0;

        // Label: "Name (City)" if available, fallback
        const name = loc?.name || `Location #${locationId}`;
        const city = loc?.city ? ` (${loc.city})` : '';
        const label = `${name}${city}`;

        const percent = capacity > 0 ? Number(((ticketCount / capacity) * 100).toFixed(2)) : 0;

        return { label, percent };
      })
      .sort((a, b) => b.percent - a.percent);

    this.chartOption5 = this.hideChartTitle({
      tooltip: { formatter: '{b}: {c}%' },
      xAxis: { type: 'category', data: occupancy.map(o => o.label) },
      yAxis: {
        type: 'value',
        max: Math.max(...occupancy.map(o => o.percent), 100),
        axisLabel: { formatter: '{value} %' }
      },
      series: [{ data: occupancy.map(o => o.percent), type: 'bar' }]
    });

    // === Chart 4: Booking Heatmap (Heatmap) ===
    this.initializeHeatmapFromTickets(soldTickets);
  }

  // ----------------------------------------------------
  // Heatmap built from real ticket timestamps
  // ----------------------------------------------------
  private initializeHeatmapFromTickets(soldTickets: any[]): void {
    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const orderedTimeSlots = [9, 12, 15, 18, 21];

    // bucket map: dayIndex|timeIndex -> count
    const bucket = new Map<string, number>();

    for (const t of soldTickets) {
      const dt = this.safeDate(t?.createdAt);
      if (!dt) continue;

      const dayIndex = this.getIsoDayIndex(dt); // 0..6 (Mon..Sun)
      const hour = dt.getHours();

      const timeIndex = this.closestTimeSlotIndex(hour, orderedTimeSlots);
      const key = `${dayIndex}|${timeIndex}`;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }

    const heatmapData: any[] = [];
    for (let d = 0; d < orderedDays.length; d++) {
      for (let ti = 0; ti < orderedTimeSlots.length; ti++) {
        const key = `${d}|${ti}`;
        const value = bucket.get(key) || 0;
        heatmapData.push([ti, d, value]); // [x=timeIndex, y=dayIndex, value]
      }
    }

    const maxValue = Math.max(...heatmapData.map(item => item[2] || 0), 1);

    // Keep your structure, but hide the internal title like dashboard
    this.chartOption4 = this.hideChartTitle({
      animation: true,
      title: {
        text: 'Booking Times Heatmap', // kept but hidden
        left: 'center',
        top: 5
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const timeSlot = orderedTimeSlots[params.value[0]];
          const day = orderedDays[params.value[1]];
          return `<strong>${day}, ${timeSlot}:00</strong><br/>Tickets: ${params.value[2]}`;
        }
      },
      grid: {
        height: '60%',
        top: '80px',
        left: '15%',
        right: '10%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: orderedTimeSlots.map(slot => `${slot}:00`),
        splitArea: { show: true },
        axisLabel: { fontSize: 12, interval: 0 }
      },
      yAxis: {
        type: 'category',
        data: orderedDays,
        splitArea: { show: true },
        axisLabel: { fontSize: 12, interval: 0 }
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        show: true
      },
      series: [
        {
          name: 'Tickets by Time',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            formatter: (params: any) => (params.value[2] > 0 ? params.value[2] : '')
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#fff'
          }
        }
      ]
    });
  }

  // ----------------------------------------------------
  // Utils
  // ----------------------------------------------------
  private safeDateOnly(value: any): string | null {
    const dt = this.safeDate(value);
    if (!dt) return null;
    return dt.toISOString().split('T')[0];
  }

  private safeDate(value: any): Date | null {
    if (!value) return null;
    const dt = new Date(value);
    return isNaN(dt.getTime()) ? null : dt;
  }

  // JS: getDay() => 0=Sun..6=Sat; convert to Mon..Sun index 0..6
  private getIsoDayIndex(dt: Date): number {
    const js = dt.getDay(); // 0..6
    return (js + 6) % 7; // Mon=0 ... Sun=6
  }

  private closestTimeSlotIndex(hour: number, slots: number[]): number {
    // nearest by absolute distance
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const dist = Math.abs(slots[i] - hour);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    return bestIdx;
  }
}
