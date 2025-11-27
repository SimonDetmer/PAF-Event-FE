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

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { OrderService, CartItem } from '../order.service';
import { AuthService } from '../auth.service';
import { User } from '../models/user';
import { API_BASE_URL } from '../api.config';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './ticket-buy.component.html',
  styleUrls: ['./ticket-buy.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketBuyComponent implements OnInit {

  user: User | null = null;
  items: CartItem[] = [];
  displayedColumns = ['title', 'price', 'quantity', 'total', 'actions'];

  loading = false;
  errorMessage = '';
  successMessage = '';

  private apiBase = '';

  constructor(
    private order: OrderService,
    private auth: AuthService,
    private http: HttpClient,
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
      this.items = this.order.getItems();
      this.cdr.markForCheck();
    });
  }

  getTotal(): number {
    return this.order.getTotal();
  }

  updateQuantity(item: CartItem, value: string): void {
    const n = parseInt(value, 10);
    if (isNaN(n) || n <= 0) {
      this.order.removeItem(item.eventId);
    } else {
      this.order.updateQuantity(item.eventId, n);
    }
    this.items = this.order.getItems();
    this.cdr.markForCheck();
  }

  removeItem(item: CartItem): void {
    this.order.removeItem(item.eventId);
    this.items = this.order.getItems();
    this.cdr.markForCheck();
  }

  cancel(): void {
    this.router.navigate(['/event-overview']);
  }

  confirmOrder(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.user) {
      this.errorMessage = 'Kein Benutzer angemeldet.';
      this.router.navigate(['/user-login']);
      return;
    }

    if (this.items.length === 0) {
      this.errorMessage = 'Keine Tickets im Warenkorb.';
      return;
    }

    this.loading = true;
    this.order.setLoading(true); // 👉 globaler Spinner an

    const payload = {
      userId: this.user.id,
      items: this.items.map(i => ({
        eventId: i.eventId,
        quantity: i.quantity
      }))
    };

    this.http.post<any>(`${this.apiBase}/orders`, payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.order.setLoading(false); // 👉 globaler Spinner aus
        this.successMessage = 'Bestellung erfolgreich erstellt.';
        console.log('Order response', response);

        this.order.clear();
        this.items = [];
        this.cdr.markForCheck();

        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 800);
      },
      error: (err) => {
        this.loading = false;
        this.order.setLoading(false); // 👉 globaler Spinner aus
        console.error('Fehler bei der Bestellung', err);

        if (err.status === 409) {
          this.errorMessage = 'Bestellung konnte nicht durchgeführt werden (Kollision / zu wenig Tickets). Bitte aktualisieren Sie die Seite.';
        } else if (err.status === 400) {
          this.errorMessage = 'Ungültige Bestelldaten. Bitte prüfen Sie den Warenkorb.';
        } else {
          this.errorMessage = 'Bestellung fehlgeschlagen. Bitte später erneut versuchen.';
        }

        this.cdr.markForCheck();
      }
    });
  }
}
