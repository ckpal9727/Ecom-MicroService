import { Component, inject } from '@angular/core';
import { ZoneInspectorService } from '../../services/zone-inspector.service';

@Component({
  selector: 'app-zone-explainer',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <div class="badge-row">
          <span class="badge" [class.badge-success]="!isZoneLoaded()" [class.badge-warning]="isZoneLoaded()">
            {{ isZoneLoaded() ? 'Zone.js Active' : 'Zoneless Mode Active' }}
          </span>
          <span class="badge badge-info">Angular 21+ Architecture</span>
        </div>
        <h2>1. Zone.js vs Zoneless Architecture</h2>
        <p class="subtitle">
          Understand how Angular traditionally detected changes vs how modern Zoneless Angular works.
        </p>
      </div>

      <div class="comparison-grid">
        <!-- Zone.js Card -->
        <div class="column-card" [class.active-border]="isZoneLoaded()">
          <div class="column-header">
            <h3>🌐 Zone.js (Traditional Angular)</h3>
            <span class="tag">Monkey-Patching Model</span>
          </div>
          <p>
            Zone.js wraps (monkey-patches) all asynchronous browser APIs (<code>setTimeout</code>,
            <code>fetch</code>, <code>addEventListener</code>, <code>Promise</code>).
          </p>

          <div class="flow-steps">
            <div class="step">
              <span class="step-num">1</span>
              <span>Browser event or async callback finishes (e.g., <code>setTimeout</code>)</span>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <span>Zone.js intercepts execution in <code>NgZone</code></span>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <span>Fires <code>onMicrotaskEmpty</code> event</span>
            </div>
            <div class="step">
              <span class="step-num">4</span>
              <span>Angular executes <code>ApplicationRef.tick()</code></span>
            </div>
            <div class="step">
              <span class="step-num">5</span>
              <span>Checks entire component tree top-to-bottom for changes</span>
            </div>
          </div>

          <div class="callout warning">
            <strong>Drawbacks:</strong>
            <ul>
              <li>Extra bundle overhead (~33 KB uncompressed).</li>
              <li>Obfuscated async stack traces.</li>
              <li>Runs change detection even if state didn't change.</li>
              <li>Incompatible with modern JS features like native async/await in downleveled bundles.</li>
            </ul>
          </div>
        </div>

        <!-- Zoneless Card -->
        <div class="column-card" [class.active-border]="!isZoneLoaded()">
          <div class="column-header">
            <h3>⚡ Zoneless (Modern Angular)</h3>
            <span class="tag tag-success">Signal-Driven Model</span>
          </div>
          <p>
            No monkey patching! Angular leaves browser APIs untouched. Change detection runs <strong>only</strong> when
            notified explicitly by reactive primitives like <strong>Signals</strong>, template events, or <code>markForCheck()</code>.
          </p>

          <div class="flow-steps">
            <div class="step">
              <span class="step-num">1</span>
              <span>Signal is updated: <code>mySignal.set(newValue)</code></span>
            </div>
            <div class="step">
              <span class="step-num">2</span>
              <span>Signal graph notifies consumers & marks consumer view dirty</span>
            </div>
            <div class="step">
              <span class="step-num">3</span>
              <span>Angular schedules microtask to refresh dirty views</span>
            </div>
            <div class="step">
              <span class="step-num">4</span>
              <span>Only relevant components and template bindings are updated</span>
            </div>
          </div>

          <div class="callout success">
            <strong>Advantages:</strong>
            <ul>
              <li>Zero Zone.js bundle overhead (faster page loads).</li>
              <li>Clean, native browser stack traces.</li>
              <li>Full compatibility with native <code>async / await</code> & Web Workers.</li>
              <li>Fine-grained reactivity without checking every untouched component.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Live Runtime Inspector -->
      <div class="runtime-inspector">
        <h3>🔬 Live Runtime Inspection</h3>
        <p>This table inspects this running app's JavaScript runtime directly:</p>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Runtime Property / API</th>
                <th>Detected Value</th>
                <th>Status</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>window.Zone</strong></td>
                <td><code>{{ isZoneLoaded() ? 'Defined (Zone.js loaded)' : 'undefined' }}</code></td>
                <td>
                  <span class="pill" [class.pill-warn]="isZoneLoaded()" [class.pill-success]="!isZoneLoaded()">
                    {{ isZoneLoaded() ? 'Zone Loaded' : 'Pure Zoneless' }}
                  </span>
                </td>
                <td>Indicates whether zone.js polyfill is present in the global scope.</td>
              </tr>
              <tr>
                <td><strong>Current Zone Name</strong></td>
                <td><code>{{ currentZone() }}</code></td>
                <td>
                  <span class="pill" [class.pill-info]="currentZone() !== 'No Zone.js Loaded'">
                    {{ currentZone() }}
                  </span>
                </td>
                <td>Zone.js execution context name (typically &lt;root&gt; or &lt;angular&gt;).</td>
              </tr>
              <tr>
                <td><strong>NgZone.isInAngularZone()</strong></td>
                <td><code>{{ isInNgZone() }}</code></td>
                <td>
                  <span class="pill" [class.pill-success]="!isInNgZone()">
                    {{ isInNgZone() ? 'Inside NgZone' : 'Outside NgZone (NoopNgZone)' }}
                  </span>
                </td>
                <td>In Zoneless, Angular uses a lightweight NoopNgZone.</td>
              </tr>
              @for (api of patchedApis; track api.name) {
                <tr>
                  <td><code>{{ api.name }}</code></td>
                  <td>{{ api.isPatched ? 'Monkey-Patched' : 'Native Browser Code' }}</td>
                  <td>
                    <span class="pill" [class.pill-warn]="api.isPatched" [class.pill-success]="!api.isPatched">
                      {{ api.isPatched ? 'Patched' : 'Native' }}
                    </span>
                  </td>
                  <td>{{ api.detail }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.75rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border: 1px solid #e2e8f0;
      margin-bottom: 2rem;
    }
    .card-header h2 {
      margin: 0.5rem 0 0.25rem 0;
      color: #0f172a;
    }
    .subtitle {
      color: #64748b;
      margin-top: 0;
    }
    .badge-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-info { background: #e0f2fe; color: #0369a1; }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    @media (max-width: 860px) {
      .comparison-grid { grid-template-columns: 1fr; }
    }
    .column-card {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    .column-card.active-border {
      border-color: #3b82f6;
      background: #f0f7ff;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .column-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #1e293b;
    }
    .tag {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      background: #e2e8f0;
      border-radius: 4px;
      color: #475569;
    }
    .tag-success {
      background: #d1fae5;
      color: #065f46;
    }
    .flow-steps {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin: 1rem 0;
      flex-grow: 1;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #ffffff;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 0.85rem;
      color: #334155;
    }
    .step-num {
      background: #3b82f6;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
      flex-shrink: 0;
    }
    .callout {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-top: 1rem;
    }
    .callout.warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }
    .callout.success {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }
    .callout ul {
      margin: 0.5rem 0 0 1rem;
      padding: 0;
    }
    .runtime-inspector {
      margin-top: 2rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .runtime-inspector h3 {
      margin-top: 0;
      color: #0f172a;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
      margin-top: 0.75rem;
    }
    th, td {
      padding: 0.65rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #e2e8f0;
      color: #334155;
      font-weight: 600;
    }
    .pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .pill-success { background: #dcfce7; color: #166534; }
    .pill-warn { background: #fef3c7; color: #92400e; }
    .pill-info { background: #e0f2fe; color: #075985; }
    code {
      background: #e2e8f0;
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.85em;
    }
  `]
})
export class ZoneExplainerComponent {
  private inspector = inject(ZoneInspectorService);

  readonly isZoneLoaded = this.inspector.isZoneLoaded;
  readonly currentZone = this.inspector.currentZoneName;
  readonly isInNgZone = this.inspector.isInNgZone;
  readonly patchedApis = this.inspector.getPatchedApis();
}
