import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { API_BASE_URL } from '../api.config';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

import { OrderService, OrderItem } from '../order.service';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgForOf,
    FormsModule,
    ReactiveFormsModule,

    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './ticket-buy.component.html',
  styleUrls: ['./ticket-buy.component.css']
})
export class TicketBuyComponent implements OnInit {

  items: OrderItem[] = [];
  userForm!: FormGroup;

  constructor(
    private order: OrderService,
    private fb: FormBuilder,
    private router: Router,
    @Inject(API_BASE_URL) private readonly apiBase: string
  ) {}

  ngOnInit(): void {
    this.items = this.order.getItems();

    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  updateQty(eventId: number, event: any): void {
    const qty = Number(event.target.value);
    this.order.updateQuantity(eventId, qty);
  }

  removeItem(id: number): void {
    this.order.removeItem(id);
    this.items = this.order.getItems();
  }

  // -------------------------------------------------------
  // FIXED ORDER FLOW — Backend Compatible
  // -------------------------------------------------------
  orderTickets(): void {
    if (this.userForm.invalid) {
      alert('Bitte gültige Email eingeben');
      return;
    }

    const payload = {
      userId: 1, // TODO: User-ID einbauen, bis dahin statisch
      items: this.items.map(i => ({
        eventId: i.eventId,
        quantity: i.quantity
      }))
    };

    console.log('POST ORDER', payload);

    fetch(`${this.apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }
        return res.json();
      })
      .then(() => {
        alert('Tickets erfolgreich gekauft!');
        this.order.clear();
        this.router.navigate(['/']);
      })
      .catch(err => {
        console.error('Fehler beim Kauf:', err);
        alert('Fehler beim Kauf!');
      });
  }
}
