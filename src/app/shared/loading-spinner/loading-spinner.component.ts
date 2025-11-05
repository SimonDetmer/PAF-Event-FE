import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../order.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="order.loading$ | async" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <mat-spinner diameter="50" strokeWidth="5"></mat-spinner>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoadingSpinnerComponent {
  constructor(public order: OrderService) {}
}
