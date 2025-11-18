import {Routes} from '@angular/router';
import {provideRouter} from '@angular/router';
import {EventOverviewComponent} from './event-overview/event-overview.component';
import {LoginComponent} from './login/login.component';
import {TicketBuyComponent} from './ticket-buy/ticket-buy.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {CreateUserComponent} from './create-user/create-user.component';
import {UserLoginComponent} from './user-login/user-login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  // Startseite → neuer Login
  { path: '', redirectTo: 'user-login', pathMatch: 'full' },

  // Neue Login-Seite (Email-Login)
  { path: 'user-login', component: UserLoginComponent },

  // Alter Login (falls du ihn behalten möchtest)
  { path: 'login', component: LoginComponent },

  // Event Overview
  { path: 'event-overview', component: EventOverviewComponent, canActivate: [authGuard] },

  // Dashboard
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  // Ticket Kauf
  { path: 'ticket-buy', component: TicketBuyComponent, canActivate: [authGuard] },

  // Benutzer erstellen
  { path: 'create-user', component: CreateUserComponent },

  // Catch-All
  { path: '**', component: NotFoundComponent }
];

export const appRoutingProviders = [
  provideRouter(routes)
];
