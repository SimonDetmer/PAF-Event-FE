import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms'; // Für ngModel im Dropdown
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmailValidatorService } from '../email-validator.service';

@Component({
  selector: 'app-ticket-buy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './ticket-buy.component.html',
  styleUrls: ['./ticket-buy.component.css']
})
export class TicketBuyComponent implements OnInit, OnDestroy {
  selectedEvents: any[] = [];
  // Objekt, in dem pro Event-ID die gewählte Ticketanzahl gespeichert wird
  selectedTicketCounts: { [key: number]: number } = {};
  // Array von 1 bis 100 für das Dropdown
  ticketNumbers: number[] = Array.from({ length: 100 }, (_, i) => i + 1);

  userForm: FormGroup;
  public emailExists: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder,
    private emailValidator: EmailValidatorService
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email], [this.emailValidator.validate.bind(this.emailValidator)]]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['events']) {
        try {
          this.selectedEvents = JSON.parse(params['events']);
          // Für jedes Event den Defaultwert 1 setzen, falls noch nicht vorhanden.
          this.selectedEvents.forEach(event => {
            if (!this.selectedTicketCounts[event.id]) {
              this.selectedTicketCounts[event.id] = 1;
            }
          });
        } catch (e) {
          console.error('Error parsing event data:', e);
        }
      }
    });

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

    const userData = this.userForm.value;

    this.http.post<any>('http://localhost:8080/users', userData).subscribe({
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
    // Für jedes Event werden so viele Ticket-Objekte erstellt,
    // wie im Dropdown (selectedTicketCounts) ausgewählt wurde.
    const tickets = this.selectedEvents.flatMap(event => {
      const count = this.selectedTicketCounts[event.id] || 1;
      return Array.from({ length: count }, () => ({
        price: event.ticketPrice || (event.tickets && event.tickets.length > 0 ? event.tickets[0].price : null),
        event: { id: event.id }
      }));
    });

    const orderPayload = {
      user: { id: userId },
      status: 'NEW',
      tickets: tickets
    };

    console.log('Sending order payload:', JSON.stringify(orderPayload, null, 2));

    this.http.post<any>('http://localhost:8080/orders', orderPayload).subscribe({
      next: () => {
        alert('Ihre Bestellung wurde erfolgreich aufgegeben!');
        this.router.navigate(['/']);
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
