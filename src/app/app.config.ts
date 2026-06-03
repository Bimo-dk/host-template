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
    // Bruges kun når host kører standalone — når host loades ind i app's runtime
    // (production), så er app's appConfig den effective config.
    provideHttpClient(withInterceptors([nexusAuthInterceptor, correlationIdInterceptor])),
  ],
};
