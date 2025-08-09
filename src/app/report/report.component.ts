import { Component, OnInit, AfterViewInit } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, TitleComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChartsCoreOption } from 'echarts';

echarts.use([LineChart, BarChart, PieChart, HeatmapChart, GridComponent, LegendComponent, TooltipComponent, VisualMapComponent, TitleComponent, CanvasRenderer]);

// Interfaces zur Typisierung
export interface TicketSale {
  date: string;
  ticketCount: number;
}

export interface TicketSalePerEvent {
  eventId: number;
  eventTitle: string;
  ticketCount: number;
}

export interface EventSummary {
  eventId: number;
  eventTitle: string;
  ticketCount: number;
  totalRevenue: number;
}

export interface BookingHeatmapEntry {
  day: string;
  timeSlot: number;
  ticketCount: number;
}

export interface LocationOccupancy {
  locationId: number;
  street: string;
  ticketCount: number;
  capacity: number;
}

// Beispiel-Daten (sinnvoll ergänzt)
const chartData = {
  // 1. Ticket Sales Over Time (Line Chart)
  ticketSalesOverTime: [
    { date: '2025-03-07', ticketCount: 10 },
    { date: '2025-03-08', ticketCount: 12 },
    { date: '2025-03-09', ticketCount: 32 },
    { date: '2025-03-10', ticketCount: 29 },
    { date: '2025-03-11', ticketCount: 78 }
  ],
  // 2. Ticket Sales Per Event (Bar Chart)
  ticketSalesPerEvent: [
    { eventId: 2, eventTitle: 'Geiel ePAry', ticketCount: 54 },
    { eventId: 1, eventTitle: 'Geile Party', ticketCount: 26 },
    { eventId: 3, eventTitle: 'Mega Konzert', ticketCount: 40 }
  ],
  // 3. Event Summaries (Pie Chart: Anteil des Gesamtumsatzes)
  eventSummaries: [
    { eventId: 2, eventTitle: 'Geiel ePAry', ticketCount: 54, totalRevenue: 1782.0 },
    { eventId: 1, eventTitle: 'Geile Party', ticketCount: 26, totalRevenue: 858.0 },
    { eventId: 3, eventTitle: 'Mega Konzert', ticketCount: 40, totalRevenue: 1200.0 }
  ],
  // 4. Booking Heatmap (Heatmap Chart)
  // Buchungszeiten: 9, 12, 15, 18, 21 Uhr für alle Wochentage (Montag bis Sonntag)
  bookingHeatmap: [
    { day: 'Monday', timeSlot: 9, ticketCount: 5 },
    { day: 'Monday', timeSlot: 12, ticketCount: 10 },
    { day: 'Monday', timeSlot: 15, ticketCount: 15 },
    { day: 'Monday', timeSlot: 18, ticketCount: 40 },
    { day: 'Monday', timeSlot: 21, ticketCount: 60 },
    { day: 'Tuesday', timeSlot: 9, ticketCount: 6 },
    { day: 'Tuesday', timeSlot: 12, ticketCount: 12 },
    { day: 'Tuesday', timeSlot: 15, ticketCount: 18 },
    { day: 'Tuesday', timeSlot: 18, ticketCount: 45 },
    { day: 'Tuesday', timeSlot: 21, ticketCount: 55 },
    { day: 'Wednesday', timeSlot: 9, ticketCount: 4 },
    { day: 'Wednesday', timeSlot: 12, ticketCount: 9 },
    { day: 'Wednesday', timeSlot: 15, ticketCount: 14 },
    { day: 'Wednesday', timeSlot: 18, ticketCount: 50 },
    { day: 'Wednesday', timeSlot: 21, ticketCount: 65 },
    { day: 'Thursday', timeSlot: 9, ticketCount: 3 },
    { day: 'Thursday', timeSlot: 12, ticketCount: 8 },
    { day: 'Thursday', timeSlot: 15, ticketCount: 13 },
    { day: 'Thursday', timeSlot: 18, ticketCount: 55 },
    { day: 'Thursday', timeSlot: 21, ticketCount: 70 },
    { day: 'Friday', timeSlot: 9, ticketCount: 7 },
    { day: 'Friday', timeSlot: 12, ticketCount: 14 },
    { day: 'Friday', timeSlot: 15, ticketCount: 20 },
    { day: 'Friday', timeSlot: 18, ticketCount: 60 },
    { day: 'Friday', timeSlot: 21, ticketCount: 80 },
    { day: 'Saturday', timeSlot: 9, ticketCount: 8 },
    { day: 'Saturday', timeSlot: 12, ticketCount: 16 },
    { day: 'Saturday', timeSlot: 15, ticketCount: 22 },
    { day: 'Saturday', timeSlot: 18, ticketCount: 65 },
    { day: 'Saturday', timeSlot: 21, ticketCount: 90 },
    { day: 'Sunday', timeSlot: 9, ticketCount: 6 },
    { day: 'Sunday', timeSlot: 12, ticketCount: 11 },
    { day: 'Sunday', timeSlot: 15, ticketCount: 17 },
    { day: 'Sunday', timeSlot: 18, ticketCount: 50 },
    { day: 'Sunday', timeSlot: 21, ticketCount: 75 }
  ],
  // 5. Location Occupancy (Bar Chart: Auslastung in %)
  locationOccupancy: [
    { locationId: 2, street: 'Geile Str 2', ticketCount: 54, capacity: 500 },
    { locationId: 1, street: 'Geile Str', ticketCount: 26, capacity: 20 },
    { locationId: 3, street: 'Coole Allee', ticketCount: 75, capacity: 100 }
  ]
};

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [NgxEchartsDirective],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  providers: [provideEchartsCore({ echarts })]
})
export class ReportComponent implements OnInit, AfterViewInit {
  // Initialisierung mit leeren Objekten, um Lint-Fehler zu vermeiden
  chartOption1: EChartsCoreOption = {}; // Ticket Sales Over Time (Line Chart)
  chartOption2: EChartsCoreOption = {}; // Ticket Sales Per Event (Bar Chart)
  chartOption3: EChartsCoreOption = {}; // Event Summaries (Pie Chart)
  chartOption4: EChartsCoreOption = {}; // Booking Heatmap (Heatmap Chart)
  chartOption5: EChartsCoreOption = {}; // Location Occupancy (Bar Chart)
  
  // Flag zur Verfolgung des Heatmap-Status
  private heatmapInitialized = false;

  constructor() {
    this.initChartOptions();
  }

  ngOnInit() {
    console.log('Report component initialized');
  }

  ngAfterViewInit() {
    // Warte eine kurze Zeit, damit DOM vollständig gerendert ist
    setTimeout(() => {
      this.initHeatmap();
    }, 100);
  }

  private initHeatmap() {
    console.log('Initializing heatmap...');
    if (!this.heatmapInitialized) {
      // Force-Update der Heatmap
      const updatedOptions = { ...this.chartOption4 };
      this.chartOption4 = updatedOptions;
      this.heatmapInitialized = true;
      console.log('Heatmap re-initialized');
    }
  }

  private initChartOptions() {
    // === Chart 1: Ticket Sales Over Time (Line Chart) ===
    const salesOverTime = chartData.ticketSalesOverTime.slice();
    salesOverTime.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dates = salesOverTime.map(item => item.date);
    const counts = salesOverTime.map(item => item.ticketCount);
    this.chartOption1 = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [{ data: counts, type: 'line', smooth: true }]
    };

    // === Chart 2: Ticket Sales Per Event (Bar Chart) ===
    const events = chartData.ticketSalesPerEvent;
    const eventTitles = events.map(e => e.eventTitle);
    const eventCounts = events.map(e => e.ticketCount);
    this.chartOption2 = {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: eventTitles },
      yAxis: { type: 'value' },
      series: [{ data: eventCounts, type: 'bar' }]
    };

    // === Chart 3: Event Summaries (Pie Chart) ===
    const summaries = chartData.eventSummaries;
    const pieData = summaries.map(item => ({
      value: item.totalRevenue,
      name: item.eventTitle
    }));
    this.chartOption3 = {
      tooltip: { trigger: 'item' },
      series: [{
        name: 'Total Revenue',
        type: 'pie',
        radius: '50%',
        data: pieData,
        label: { formatter: '{b}: {d}%' }
      }]
    };

    // === Chart 5: Location Occupancy (Bar Chart) ===
    const locations = chartData.locationOccupancy;
    const locationLabels = locations.map(loc => loc.street);
    const occupancyPercents = locations.map(loc =>
      Number(((loc.ticketCount / loc.capacity) * 100).toFixed(2))
    );
    this.chartOption5 = {
      tooltip: { formatter: '{b}: {c}%' },
      xAxis: { type: 'category', data: locationLabels },
      yAxis: {
        type: 'value',
        max: Math.max(...occupancyPercents, 100),
        axisLabel: { formatter: '{value} %' }
      },
      series: [{ data: occupancyPercents, type: 'bar' }]
    };

    // === Chart 4: Booking Heatmap (Heatmap Chart) ===
    this.initializeHeatmapChart();
  }

  private initializeHeatmapChart() {
    console.log('Initializing Heatmap chart data...');
    const heatmapRaw: BookingHeatmapEntry[] = chartData.bookingHeatmap;
    
    // Definiere geordnete Tage und Zeitfenster für bessere Darstellung
    const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const orderedTimeSlots = [9, 12, 15, 18, 21];
    
    // Array für direkte Verwendung von ECharts
    const heatmapData: any[] = [];
    
    // 2D-Array-Struktur erstellen
    for (let dayIndex = 0; dayIndex < orderedDays.length; dayIndex++) {
      for (let timeIndex = 0; timeIndex < orderedTimeSlots.length; timeIndex++) {
        const day = orderedDays[dayIndex];
        const timeSlot = orderedTimeSlots[timeIndex];
        
        // Suche den entsprechenden Eintrag
        const entry = heatmapRaw.find(item => 
          item.day === day && item.timeSlot === timeSlot
        );
        
        // Werte zuordnen
        const value = entry ? entry.ticketCount : 0;
        
        // Daten im Format [x, y, value] hinzufügen
        heatmapData.push([timeIndex, dayIndex, value]);
      }
    }
    
    // Log um sicherzustellen, dass Daten vorhanden sind
    console.log('Generated heatmap data:', heatmapData);
    
    if (heatmapData.length === 0) {
      console.error('No heatmap data available!'); 
      return;
    }
    
    // Maximum-Wert für die Farbskala
    const maxValue = Math.max(...heatmapData.map(item => item[2] || 0), 1);
    console.log('Max value for heatmap:', maxValue);
    
    // Vereinfachte und robustere Heatmap-Konfiguration
    this.chartOption4 = {
      animation: true,
      title: {
        text: 'Booking Times Heatmap',
        left: 'center',
        top: 5
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const timeSlot = orderedTimeSlots[params.value[0]];
          const day = orderedDays[params.value[1]];
          return `<strong>${day}, ${timeSlot}:00</strong><br/>Tickets: ${params.value[2]}`;
        },
        textStyle: {
          fontSize: 14
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
        axisLabel: { 
          fontSize: 12,
          interval: 0,
          rotate: 0
        },
        axisTick: { show: true },
        axisLine: { show: true }
      },
      yAxis: {
        type: 'category',
        data: orderedDays,
        splitArea: { show: true },
        axisLabel: { 
          fontSize: 12,
          interval: 0
        },
        axisTick: { show: true },
        axisLine: { show: true }
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0',
        show: true,
        inRange: {
          color: ['#F5F5F5', '#ADD8E6', '#90CAF9', '#42A5F5', '#1976D2', '#0D47A1']
        },
        textStyle: {
          color: '#333'
        }
      },
      series: [
        {
          name: 'Tickets by Time',
          type: 'heatmap',
          data: heatmapData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            color: '#000',
            formatter: (params: any) => {
              return params.value[2] > 0 ? params.value[2] : '';
            }
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#fff'
          }
        }
      ]
    };
    
    console.log('Heatmap configuration created successfully');
  }
}
