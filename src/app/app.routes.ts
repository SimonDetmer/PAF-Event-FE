import {Routes} from '@angular/router';
import {provideRouter} from '@angular/router';
import {EventOverviewComponent} from './event-overview/event-overview.component';
import {LoginComponent} from './login/login.component';
import {TicketBuyComponent} from './ticket-buy/ticket-buy.component';
import {NotFoundComponent} from './not-found/not-found.component';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: 'event-overview', component: EventOverviewComponent},
  {path: 'login', component: LoginComponent},
  {path: 'ticket-buy', component: TicketBuyComponent},
  {path: 'dashboard', component: DashboardComponent},
  {path: '**', component: NotFoundComponent}

  // Weitere Routen hier
];

export const appRoutingProviders = [
  provideRouter(routes)
];
