import { Injectable, inject, NgZone, signal } from '@angular/core';

export interface PatchInfo {
  name: string;
  isPatched: boolean;
  detail: string;
}

@Injectable({
  providedIn: 'root'
})
export class ZoneInspectorService {
  private ngZone = inject(NgZone);

  // Signals to hold live state
  readonly isZoneLoaded = signal<boolean>(typeof (window as any).Zone !== 'undefined');
  readonly currentZoneName = signal<string>(
    typeof (window as any).Zone !== 'undefined' ? (window as any).Zone.current.name : 'No Zone.js Loaded'
  );
  readonly isInNgZone = signal<boolean>(NgZone.isInAngularZone());
  readonly cdTickCount = signal<number>(0);

  incrementTickCount() {
    this.cdTickCount.update(count => count + 1);
  }

  getPatchedApis(): PatchInfo[] {
    const isZone = typeof (window as any).Zone !== 'undefined';
    const setTimeoutPatched = isZone && !!((window.setTimeout as any).__zone_symbol__ || (window as any).Zone?.current);
    const promisePatched = isZone && !!((window.Promise as any).__zone_symbol__ || (window as any).Zone?.__load_patch);
    const addEventListenerPatched = isZone && !!((EventTarget.prototype.addEventListener as any).__zone_symbol__);

    return [
      {
        name: 'window.setTimeout',
        isPatched: setTimeoutPatched,
        detail: setTimeoutPatched
          ? 'Monkey-patched by Zone.js: intercepts timer creation and triggers CD on completion.'
          : 'Original browser native function (Unpatched). No automatic zone notification.'
      },
      {
        name: 'window.Promise',
        isPatched: promisePatched,
        detail: promisePatched
          ? 'Monkey-patched by Zone.js: resolves microtasks inside the Angular Zone to trigger CD.'
          : 'Native browser Promise (Unpatched).'
      },
      {
        name: 'EventTarget.addEventListener',
        isPatched: addEventListenerPatched,
        detail: addEventListenerPatched
          ? 'Monkey-patched by Zone.js: DOM clicks, input, scrolls trigger CD automatically.'
          : 'Native browser EventTarget (Unpatched).'
      }
    ];
  }
}
