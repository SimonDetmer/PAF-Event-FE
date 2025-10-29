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
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'event-overview', component: EventOverviewComponent, canActivate: [authGuard]},
  {path: 'login', component: LoginComponent},
  {path: 'user-login', component: UserLoginComponent},
  {path: 'create-user', component: CreateUserComponent},
  {path: 'ticket-buy', component: TicketBuyComponent, canActivate: [authGuard]},
  {path: 'dashboard', component: DashboardComponent, canActivate: [authGuard]},
  {path: '**', component: NotFoundComponent}

  // Weitere Routen hier
];

export const appRoutingProviders = [
  provideRouter(routes)
];
