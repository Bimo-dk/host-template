import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { nexusAuthInterceptor } from './interceptors/nexus-auth.interceptor';
import { correlationIdInterceptor } from './interceptors/correlation-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Used only when host runs standalone — when host is loaded into app's runtime
    // (production), app's appConfig is the effective config.
    provideHttpClient(withInterceptors([nexusAuthInterceptor, correlationIdInterceptor])),
  ],
};
