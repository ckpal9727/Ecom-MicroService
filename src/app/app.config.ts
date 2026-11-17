import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Enables pure Zoneless Change Detection (No Zone.js required!)
    provideZonelessChangeDetection(),
  ],
};
