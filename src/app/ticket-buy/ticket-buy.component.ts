import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // Für ngModel im Dropdown
import { MatButtonModule } from '@angular/material/button';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmailValidatorService } from '../email-validator.service';
import { API_BASE_URL } from '../api.config';
import { OrderService, OrderItem } from '../order.service';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule],
  templateUrl: './ticket-buy.component.html',
  styleUrls: ['./ticket-buy.component.css']
})
export class TicketBuyComponent implements OnInit, OnDestroy {
  items: OrderItem[] = [];

  userForm: FormGroup;
  public emailExists: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private emailValidator: EmailValidatorService,
    @Inject(API_BASE_URL) private readonly apiBase: string,
    public order: OrderService
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email], [this.emailValidator.validate.bind(this.emailValidator)]]
    });
  }

  ngOnInit(): void {
    this.items = this.order.getItems();
    console.log('Cart items on init:', this.items);

    this.userForm.get('email')?.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const errors = this.userForm.get('email')?.errors;
      this.emailExists = !!(errors && errors['emailTaken']);
    });
  }

  get formIsValid(): boolean {
    if (!this.userForm) {
      return false;
    }
    const emailControl = this.userForm.get('email');
    if (emailControl && emailControl.errors) {
      const errorKeys = Object.keys(emailControl.errors);
      if (errorKeys.length === 1 && emailControl.errors['emailTaken']) {
        return true;
      }
    }
    return this.userForm.valid;
  }

  orderTickets(): void {
    if (!this.formIsValid) {
      alert('Bitte füllen Sie alle Felder im User-Formular korrekt aus.');
      return;
    }

    if (this.items.length === 0) {
      alert('Ihr Warenkorb ist leer.');
      return;
    }

    const userData = this.userForm.value;

    this.http.post<any>(`${this.apiBase}/users`, userData).subscribe({
      next: createdUser => {
        console.log('User created or found:', createdUser);
        this.createOrder(createdUser.id);
      },
      error: error => {
        console.error('Error creating/finding user:', error);
        alert('Benutzer konnte nicht erstellt werden.');
      }
    });
  }

  createOrder(userId: number): void {
    // Set loading state
    this.order.setLoading(true);

    // Create order items with version information
    const orderItems = this.items.map(item => ({
      eventId: item.eventId,
      quantity: item.quantity,
      version: item.version
    }));

    const orderPayload = {
      userId: userId,
      items: orderItems
    };

    console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2));

    this.http.post<any>(`${this.apiBase}/api/orders`, orderPayload).subscribe({
      next: (order) => {
        // Order successful
        alert('Ihre Bestellung wurde erfolgreich aufgegeben!');
        this.order.clear();
        this.items = [];
        this.router.navigate(['/event-overview']);
      },
      error: (error) => {
        console.error('Error creating order:', error);
        
        if (error.status === 409) {
          // Handle concurrency conflict
          alert('Die Veranstaltungsdaten wurden in der Zwischenzeit aktualisiert. Bitte überprüfen Sie die Verfügbarkeit und versuchen Sie es erneut.');
          
          // Refresh the page to get the latest data
          window.location.reload();
        } else if (error.status === 400 && error.error?.error === 'INSUFFICIENT_TICKETS') {
          // Handle insufficient tickets
          alert(`Fehler: ${error.error?.message || 'Nicht genügend Tickets verfügbar.'}`);
          
          // Update the cart with the latest available tickets
          this.items = this.items.map(item => {
            const updatedItem = { ...item };
            // You might want to update the availableTickets here if the backend provides them
            return updatedItem;
          });
        } else {
          // Generic error
          alert('Bestellung konnte nicht aufgegeben werden. Bitte versuchen Sie es später erneut.');
        }
      },
      complete: () => {
        // Reset loading state when the request is complete
        this.order.setLoading(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
