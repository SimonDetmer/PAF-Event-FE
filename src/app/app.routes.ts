import { Routes, provideRouter } from '@angular/router';

import { EventOverviewComponent } from './event-overview/event-overview.component';
import { LoginComponent } from './login/login.component';
import { TicketBuyComponent } from './ticket-buy/ticket-buy.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { LocationManagementComponent } from './location-management/location-management.component';

import { authGuard } from './auth.guard';

export const routes: Routes = [
  // Startseite → neuer Login
  { path: '', redirectTo: 'user-login', pathMatch: 'full' },

  // Neuer einfacher Login (Email)
  { path: 'user-login', component: UserLoginComponent },

  // Alte Login-Variante (falls noch genutzt)
  { path: 'login', component: LoginComponent },

  // Dashboard (nur eingeloggt)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Event-Übersicht (nur eingeloggt)
  { path: 'event-overview', component: EventOverviewComponent, canActivate: [authGuard] },

  // Ticket-Kauf (nur eingeloggt)
  { path: 'ticket-buy', component: TicketBuyComponent, canActivate: [authGuard] },

  // Location-Verwaltung (nur eingeloggt – Rolle wird in der Komponente geprüft)
  { path: 'locations', component: LocationManagementComponent, canActivate: [authGuard] },

  // Benutzer erstellen (Registrierung)
  { path: 'create-user', component: CreateUserComponent },

  // Catch-All
  { path: '**', component: NotFoundComponent }
];

export const appRoutingProviders = [
  provideRouter(routes)
];
