import { Component, signal, input, output, model } from '@angular/core';

// --- Child Component using Signal input, model, output ---
@Component({
  selector: 'app-child-signal-card',
  standalone: true,
  template: `
    <div class="child-box">
      <div class="child-header">
        <h4>👶 Child Component</h4>
        <span class="pill-child">Child Context</span>
      </div>

      <div class="field">
        <label>1. Signal input() [read-only]:</label>
        <div class="val-box">{{ title() }}</div>
      </div>

      <div class="field">
        <label>2. Signal model() [two-way binding]:</label>
        <div class="model-row">
          <input
            type="text"
            class="input-box"
            [value]="searchKeyword()"
            (input)="onInputChange($event)"
            placeholder="Type to update model..."
          />
          <button class="btn btn-sm" (click)="clearKeyword()">Clear in Child</button>
        </div>
        <small class="hint">Child can mutate <code>searchKeyword.set()</code> and parent syncs!</small>
      </div>

      <div class="field">
        <label>3. Signal output():</label>
        <div class="btn-group">
          <button class="btn btn-notify" (click)="emitAlert('Action completed by Child')">
            Emit output('Action')
          </button>
          <button class="btn btn-notify" (click)="emitAlert('Child item starred ⭐')">
            Emit output('Star ⭐')
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .child-box {
      background: #f1f5f9;
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
    }
    .child-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .child-header h4 { margin: 0; color: #334155; }
    .pill-child {
      font-size: 0.7rem;
      background: #cbd5e1;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      color: #1e293b;
    }
    .field { margin-bottom: 1rem; }
    .field label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.25rem;
    }
    .val-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #0f172a;
    }
    .model-row { display: flex; gap: 0.5rem; }
    .input-box {
      flex: 1;
      padding: 0.4rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .hint { color: #64748b; font-size: 0.75rem; display: block; margin-top: 0.25rem; }
    .btn-group { display: flex; gap: 0.5rem; }
    .btn {
      padding: 0.35rem 0.65rem;
      font-size: 0.8rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
    }
    .btn-sm { background: #e2e8f0; color: #334155; }
    .btn-notify { background: #4f46e5; color: white; }
    .btn-notify:hover { background: #4338ca; }
  `]
})
export class ChildSignalCardComponent {
  // 1. Signal input (replaces @Input)
  readonly title = input.required<string>();

  // 2. Signal model (two-way binding: replaces @Input + @Output() Change)
  readonly searchKeyword = model<string>('');

  // 3. Signal output (replaces @Output + EventEmitter)
  readonly notification = output<string>();

  onInputChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchKeyword.set(val);
  }

  clearKeyword() {
    this.searchKeyword.set('');
  }

  emitAlert(msg: string) {
    this.notification.emit(msg);
  }
}

// --- Parent Component ---
@Component({
  selector: 'app-parent-child-demo',
  standalone: true,
  imports: [ChildSignalCardComponent],
  template: `
    <div class="card">
      <div class="card-header">
        <span class="badge badge-indigo">Signal Component APIs</span>
        <h2>4. Component Communication: input(), model(), and output()</h2>
        <p class="subtitle">
          Say goodbye to decorators (<code>&#64;Input</code>, <code>&#64;Output</code>). Signals now power modern component inputs and two-way bindings.
        </p>
      </div>

      <div class="parent-content">
        <div class="state-overview">
          <div class="state-card">
            <span class="s-label">Parent Title Signal:</span>
            <span class="s-val">{{ parentTitle() }}</span>
            <div class="row-actions">
              <button class="btn-xs" (click)="changeTitle('Dashboard Analytics')">Analytics</button>
              <button class="btn-xs" (click)="changeTitle('User Profile Settings')">Profile</button>
            </div>
          </div>

          <div class="state-card highlight">
            <span class="s-label">Two-way [(model)] Keyword:</span>
            <span class="s-val">"{{ sharedKeyword() }}"</span>
            <div class="row-actions">
              <button class="btn-xs" (click)="sharedKeyword.set('Angular 21')">Set 'Angular 21'</button>
              <button class="btn-xs" (click)="sharedKeyword.set('')">Reset</button>
            </div>
          </div>

          <div class="state-card">
            <span class="s-label">Last Output from Child:</span>
            <span class="s-val">{{ lastChildEvent() || '(None yet)' }}</span>
          </div>
        </div>

        <!-- Child Component embedded with Signal bindings -->
        <app-child-signal-card
          [title]="parentTitle()"
          [(searchKeyword)]="sharedKeyword"
          (notification)="handleChildNotification($event)"
        />

        <div class="code-box">
          <pre><code>{{ snippetComponent }}</code></pre>
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
    .badge-indigo { background: #e0e7ff; color: #4338ca; }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-header h2 { margin: 0.5rem 0 0.25rem 0; color: #0f172a; }
    .subtitle { color: #64748b; margin-top: 0; }
    .state-overview {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-top: 1rem;
    }
    @media (max-width: 800px) {
      .state-overview { grid-template-columns: 1fr; }
    }
    .state-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
    }
    .state-card.highlight {
      border-color: #6366f1;
      background: #eef2ff;
    }
    .s-label { font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 0.25rem; }
    .s-val { font-size: 1rem; font-weight: 700; color: #1e293b; display: block; margin-bottom: 0.5rem; word-break: break-all; }
    .row-actions { display: flex; gap: 0.35rem; }
    .btn-xs {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 0.2rem 0.45rem;
      font-size: 0.72rem;
      cursor: pointer;
    }
    .btn-xs:hover { background: #f1f5f9; }
    .code-box {
      margin-top: 1.25rem;
      background: #0f172a;
      border-radius: 6px;
      padding: 0.75rem;
      overflow-x: auto;
    }
    .code-box pre { margin: 0; }
    .code-box code { font-family: Consolas, monospace; font-size: 0.75rem; color: #e2e8f0; }
  `]
})
export class ParentChildDemoComponent {
  readonly parentTitle = signal('Dashboard Analytics');
  readonly sharedKeyword = signal('TypeScript');
  readonly lastChildEvent = signal('');

  readonly snippetComponent = `// 1. Modern Signal Input
readonly title = input.required<string>();

// 2. Modern Signal Model (Two-way)
readonly searchKeyword = model<string>('');

// 3. Modern Signal Output
readonly notification = output<string>();

// In Parent Template:
<app-child-signal-card
  [title]="parentTitle()"
  [(searchKeyword)]="sharedKeyword"
  (notification)="handleChildNotification($event)"
/>`;

  changeTitle(newTitle: string) {
    this.parentTitle.set(newTitle);
  }

  handleChildNotification(eventMsg: string) {
    this.lastChildEvent.set(`${eventMsg} (at ${new Date().toLocaleTimeString()})`);
  }
}
