import { Component, ChangeDetectorRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-zoneless-lab',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <span class="badge badge-warning">The Critical Difference</span>
        <h2>3. Zoneless in Action: Plain Variable vs Signal Async Lab</h2>
        <p class="subtitle">
          See the exact moment where Zone.js and Zoneless diverge! What happens when data changes in an async callback?
        </p>
      </div>

      <!-- Explanation banner -->
      <div class="info-banner">
        <strong>The "Zoneless Trap" Explained:</strong>
        <p>
          In traditional <strong>Zone.js</strong>, monkey-patched <code>setTimeout</code>, <code>Promise</code>, and DOM events
          automatically trigger change detection. Mutating a plain variable (<code>this.count++</code>) magically worked.
        </p>
        <p>
          In <strong>Zoneless</strong>, Angular does not hijack browser APIs. If you mutate a plain variable inside
          <code>setTimeout</code> or <code>fetch</code>, <strong>the UI will NOT update</strong> because Angular is never notified!
          <strong>Signals solve this completely</strong> because <code>signal.set()</code> / <code>signal.update()</code> directly
          tells Angular to schedule a view update.
        </p>
      </div>

      <div class="comparison-grid">
        <!-- Plain Variable Box -->
        <div class="lab-box danger-zone">
          <div class="lab-box-header">
            <h3>❌ Plain Variable (No Signal)</h3>
            <span class="type-pill">let plainVar = 0</span>
          </div>

          <div class="val-display">
            <div class="display-item">
              <span class="disp-label">Rendered in Template:</span>
              <span class="disp-val error-color">{{ plainCounter }}</span>
            </div>
            <div class="display-item">
              <span class="disp-label">Actual Memory Value:</span>
              <span class="disp-val mono">{{ getMemoryPlainCounter() }}</span>
            </div>
          </div>

          <p class="box-desc">
            Trigger an async mutation below. Notice that in Zoneless, memory updates but the UI stays frozen until a CD cycle is triggered!
          </p>

          <div class="actions">
            <button class="btn btn-outline" (click)="incrementPlainAsync()">
              ⏱️ Async +1 (setTimeout 600ms)
            </button>
            <button class="btn btn-outline" (click)="incrementPlainImmediate()">
              ⚡ Synchronous +1 (Button Click)
            </button>
            <button class="btn btn-warning" (click)="forceMarkForCheck()">
              🔔 Manually call cdr.markForCheck()
            </button>
          </div>

          <div class="status-box">
            <small>Status: {{ plainStatus }}</small>
          </div>

          <div class="code-preview">
            <pre><code>{{ snippetPlain }}</code></pre>
          </div>
        </div>

        <!-- Signal Box -->
        <div class="lab-box success-zone">
          <div class="lab-box-header">
            <h3>✅ Modern Angular Signal</h3>
            <span class="type-pill success">signal(0)</span>
          </div>

          <div class="val-display">
            <div class="display-item">
              <span class="disp-label">Rendered in Template:</span>
              <span class="disp-val success-color">{{ signalCounter() }}</span>
            </div>
            <div class="display-item">
              <span class="disp-label">Actual Memory Value:</span>
              <span class="disp-val mono">{{ signalCounter() }}</span>
            </div>
          </div>

          <p class="box-desc">
            Signals notify Angular's reactive graph on change. The template updates immediately and reliably in both Zoneless and Zone.js!
          </p>

          <div class="actions">
            <button class="btn btn-primary" (click)="incrementSignalAsync()">
              ⏱️ Async +1 (setTimeout 600ms)
            </button>
            <button class="btn btn-primary" (click)="incrementSignalImmediate()">
              ⚡ Synchronous +1 (Button Click)
            </button>
            <button class="btn btn-outline" (click)="resetSignalCounter()">
              🔄 Reset Signal
            </button>
          </div>

          <div class="status-box">
            <small>Status: {{ signalStatus() }}</small>
          </div>

          <div class="code-preview">
            <pre><code>{{ snippetSignal }}</code></pre>
          </div>
        </div>
      </div>

      <!-- Takeaway Summary -->
      <div class="summary-box">
        <h4>🎯 Key Takeaways for Zoneless Angular:</h4>
        <ol>
          <li><strong>Template event bindings</strong> (like <code>(click)="doSomething()"</code>) still trigger change detection because Angular owns the template listener.</li>
          <li><strong>Native async callbacks</strong> (like <code>setTimeout</code>, <code>Promise.then</code>, <code>WebSocket</code>, <code>indexedDB</code>) <strong>do NOT</strong> trigger change detection for plain properties in Zoneless.</li>
          <li><strong>Signals are the future-proof solution:</strong> Wrapping state in <code>signal()</code> makes your components work seamlessly in both Zone.js and Zoneless without any manual <code>cdr.markForCheck()</code>.</li>
        </ol>
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
    .badge-warning { background: #fef3c7; color: #b45309; }
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
    .info-banner {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 0.85rem 1rem;
      border-radius: 6px;
      margin: 1.25rem 0;
      font-size: 0.88rem;
      color: #1e3a8a;
    }
    .info-banner p { margin: 0.35rem 0 0 0; }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1rem;
    }
    @media (max-width: 900px) {
      .comparison-grid { grid-template-columns: 1fr; }
    }
    .lab-box {
      border-radius: 10px;
      padding: 1.25rem;
      border: 2px solid;
      display: flex;
      flex-direction: column;
    }
    .danger-zone {
      background: #fffafa;
      border-color: #fecdd3;
    }
    .success-zone {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .lab-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .lab-box-header h3 { margin: 0; font-size: 1.05rem; }
    .type-pill {
      font-size: 0.75rem;
      font-family: monospace;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      background: #fecdd3;
      color: #9f1239;
    }
    .type-pill.success {
      background: #bbf7d0;
      color: #166534;
    }
    .val-display {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .display-item {
      background: #ffffff;
      padding: 0.6rem;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      text-align: center;
    }
    .disp-label { display: block; font-size: 0.72rem; color: #64748b; margin-bottom: 0.2rem; }
    .disp-val { font-size: 1.6rem; font-weight: 700; }
    .disp-val.error-color { color: #e11d48; }
    .disp-val.success-color { color: #16a34a; }
    .disp-val.mono { font-family: monospace; color: #475569; }
    .box-desc { font-size: 0.82rem; color: #64748b; margin-top: 0; margin-bottom: 0.85rem; }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      margin-bottom: 0.85rem;
    }
    .btn {
      padding: 0.45rem 0.75rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-align: left;
    }
    .btn-outline { background: #ffffff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f8fafc; }
    .btn-primary { background: #16a34a; color: #ffffff; }
    .btn-primary:hover { background: #15803d; }
    .btn-warning { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; }
    .btn-warning:hover { background: #fde68a; }
    .status-box {
      background: rgba(0,0,0,0.03);
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      margin-bottom: 0.85rem;
      color: #475569;
    }
    .code-preview {
      margin-top: auto;
      background: #0f172a;
      border-radius: 6px;
      padding: 0.65rem;
    }
    .code-preview pre { margin: 0; }
    .code-preview code { font-family: Consolas, monospace; font-size: 0.72rem; color: #f1f5f9; }
    .summary-box {
      margin-top: 1.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }
    .summary-box h4 { margin: 0 0 0.5rem 0; color: #0f172a; font-size: 0.95rem; }
    .summary-box ol { margin: 0; padding-left: 1.25rem; font-size: 0.85rem; color: #334155; }
    .summary-box li { margin-bottom: 0.35rem; }
  `]
})
export class ZonelessLabComponent {
  private cdr = inject(ChangeDetectorRef);

  // 1. Plain Variable State
  plainCounter = 0;
  plainStatus = 'Idle';
  private memoryCounterTracker = 0;

  // 2. Signal State
  readonly signalCounter = signal(0);
  readonly signalStatus = signal('Idle');

  readonly snippetPlain = `// Plain variable mutation in async callback
plainCounter = 0;

setTimeout(() => {
  this.plainCounter++; 
  // In Zone.js: UI updates (Zone intercepts setTimeout)
  // In Zoneless: UI DOES NOT UPDATE! (No signal, no zone)
}, 600);`;

  readonly snippetSignal = `// Signal mutation in async callback
readonly signalCounter = signal(0);

setTimeout(() => {
  this.signalCounter.update(c => c + 1);
  // In Zoneless: UI UPDATES AUTOMATICALLY!
  // Signals notify Angular to schedule a view refresh.
}, 600);`;

  getMemoryPlainCounter(): number {
    return this.memoryCounterTracker;
  }

  // --- Plain Variable Demonstrations ---
  incrementPlainAsync() {
    this.plainStatus = 'Timer scheduled (600ms)...';
    setTimeout(() => {
      this.plainCounter++;
      this.memoryCounterTracker++;
      this.plainStatus = `Memory updated to ${this.plainCounter}. In Zoneless, template may stay unchanged!`;
      console.log(`[Plain Async] Memory is now: ${this.plainCounter}`);
    }, 600);
  }

  incrementPlainImmediate() {
    // Synchronous click handler: Angular template listener schedules CD automatically after the listener returns
    this.plainCounter++;
    this.memoryCounterTracker++;
    this.plainStatus = `Sync click updated counter to ${this.plainCounter} (Template listener triggered CD).`;
  }

  forceMarkForCheck() {
    // Explicitly notify Angular that this view needs check
    this.cdr.markForCheck();
    this.plainStatus = `cdr.markForCheck() executed! View refreshed to ${this.plainCounter}.`;
  }

  // --- Signal Demonstrations ---
  incrementSignalAsync() {
    this.signalStatus.set('Timer scheduled (600ms)...');
    setTimeout(() => {
      this.signalCounter.update(c => c + 1);
      this.signalStatus.set(`Signal updated to ${this.signalCounter()}. Angular immediately scheduled view update.`);
      console.log(`[Signal Async] Signal is now: ${this.signalCounter()}`);
    }, 600);
  }

  incrementSignalImmediate() {
    this.signalCounter.update(c => c + 1);
    this.signalStatus.set(`Sync update to ${this.signalCounter()}`);
  }

  resetSignalCounter() {
    this.signalCounter.set(0);
    this.signalStatus.set('Signal reset to 0');
  }
}
