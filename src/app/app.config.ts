import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { NgxEchartsModule } from 'ngx-echarts';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // Routing
    provideRouter(routes),

    provideHttpClient(
      withInterceptors([authInterceptor])
    ),

    importProvidersFrom(NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    })),

    // Auth-Service
    AuthService,
  ]
};
