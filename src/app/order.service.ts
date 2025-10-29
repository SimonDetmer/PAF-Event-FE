import { Injectable } from '@angular/core';

export interface OrderItem {
  eventId: number;
  title: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private items: OrderItem[] = [];

  getItems(): OrderItem[] {
    return this.items;
  }

  getTotalCount(): number {
    return this.items.reduce((sum, it) => sum + it.quantity, 0);
  }

  addItem(item: OrderItem): void {
    const existing = this.items.find(i => i.eventId === item.eventId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }
  }

  updateQuantity(eventId: number, quantity: number): void {
    const existing = this.items.find(i => i.eventId === eventId);
    if (existing) existing.quantity = quantity;
  }

  removeItem(eventId: number): void {
    this.items = this.items.filter(i => i.eventId !== eventId);
  }

  clear(): void {
    this.items = [];
  }
}
