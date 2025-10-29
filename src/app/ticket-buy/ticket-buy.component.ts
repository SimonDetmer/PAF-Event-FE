import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // Für ngModel im Dropdown
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmailValidatorService } from '../email-validator.service';
import { API_BASE_URL } from '../api.config';
import { OrderService, OrderItem } from '../order.service';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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
    // Aus Warenkorbpositionen passende Ticket-Objekte erzeugen
    const tickets = this.items.flatMap(it =>
      Array.from({ length: it.quantity }, () => ({
        price: it.price,
        event: { id: it.eventId }
      }))
    );

    const orderPayload = {
      user: { id: userId },
      status: 'NEW',
      tickets: tickets
    };

    console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2));

    this.http.post<any>(`${this.apiBase}/orders`, orderPayload).subscribe({
      next: () => {
        alert('Ihre Bestellung wurde erfolgreich aufgegeben!');
        this.order.clear();
        this.items = [];
        this.router.navigate(['/event-overview']);
      },
      error: error => {
        console.error('Error creating order:', error);
        alert('Bestellung konnte nicht aufgegeben werden.');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
