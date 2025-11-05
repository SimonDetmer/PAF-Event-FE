import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface OrderItem {
  eventId: number;
  title: string;
  price: number;
  quantity: number;
  version: number;
  availableTickets: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private items: OrderItem[] = [];
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  getItems(): OrderItem[] {
    return [...this.items];
  }

  getTotalCount(): number {
    return this.items.reduce((sum, it) => sum + it.quantity, 0);
  }

  addItem(item: OrderItem): void {
    const existing = this.items.find(i => i.eventId === item.eventId);
    if (existing) {
      existing.quantity = item.quantity;
      existing.version = item.version;
      existing.availableTickets = item.availableTickets;
    } else {
      this.items.push({ ...item });
    }
  }

  updateItemVersion(eventId: number, newVersion: number, newAvailableTickets: number): void {
    const item = this.items.find(i => i.eventId === eventId);
    if (item) {
      item.version = newVersion;
      item.availableTickets = newAvailableTickets;
    }
  }

  getItem(eventId: number): OrderItem | undefined {
    return this.items.find(i => i.eventId === eventId);
  }

  updateQuantity(eventId: number, quantity: number): void {
    const existing = this.items.find(i => i.eventId === eventId);
    if (existing) {
      existing.quantity = quantity;
    }
  }

  removeItem(eventId: number): void {
    this.items = this.items.filter(i => i.eventId !== eventId);
  }

  clear(): void {
    this.items = [];
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }
}
