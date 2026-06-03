import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNexusHost } from '@bimo-dk/nexus-runtime';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNexusHost({
      configDefaults: {
        registryUrl: '/api',
        nexusToken: 'dev-token',
        staticBackupUrl: '/assets/registry-backup/remotes.json',
      },
    }),
  ],
};
