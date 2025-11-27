import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  eventId: number;
  title: string;
  price: number;
  quantity: number;
  version?: number;
  availableTickets?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  // Für globalen Loading-Spinner
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  constructor() {}

  // ----------------------------------------------------
  // INTERNER ZUGRIFF AUF ITEMS
  // ----------------------------------------------------
  private get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  private set items(value: CartItem[]) {
    this.itemsSubject.next(value);
  }

  // ----------------------------------------------------
  // LOADING-STATUS (für Spinner)
  // ----------------------------------------------------
  setLoading(isLoading: boolean): void {
    this.loadingSubject.next(isLoading);
  }

  // ----------------------------------------------------
  // CART-API
  // ----------------------------------------------------
  getItems(): CartItem[] {
    return this.items;
  }

  addItem(item: CartItem): void {
    const existing = this.items.find(i => i.eventId === item.eventId);

    if (existing) {
      const newQuantity = existing.quantity + item.quantity;
      const max = existing.availableTickets ?? newQuantity;
      existing.quantity = Math.min(newQuantity, max);
    } else {
      const max = item.availableTickets ?? item.quantity;
      this.items = [
        ...this.items,
        { ...item, quantity: Math.min(item.quantity, max) }
      ];
    }

    this.itemsSubject.next([...this.items]);
  }

  updateQuantity(eventId: number, quantity: number): void {
    const items = [...this.items];
    const item = items.find(i => i.eventId === eventId);
    if (!item) return;

    if (quantity <= 0) {
      this.removeItem(eventId);
      return;
    }

    const max = item.availableTickets ?? quantity;
    item.quantity = Math.min(quantity, max);
    this.items = items;
  }

  removeItem(eventId: number): void {
    this.items = this.items.filter(i => i.eventId !== eventId);
  }

  clear(): void {
    this.items = [];
  }

  getTotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  // 👇 Wird im Header für das Badge genutzt
  getTotalCount(): number {
    return this.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }
}
