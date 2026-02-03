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
  { path: '', redirectTo: 'user-login', pathMatch: 'full' },

  { path: 'user-login', component: UserLoginComponent },

  { path: 'login', component: LoginComponent },

  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

  { path: 'event-overview', component: EventOverviewComponent, canActivate: [authGuard] },

  { path: 'ticket-buy', component: TicketBuyComponent, canActivate: [authGuard] },

  { path: 'locations', component: LocationManagementComponent, canActivate: [authGuard] },

  { path: 'create-user', component: CreateUserComponent },

  { path: '**', component: NotFoundComponent }
];

export const appRoutingProviders = [
  provideRouter(routes)
];
