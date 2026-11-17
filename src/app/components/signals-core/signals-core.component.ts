import { Component, signal, computed, effect, linkedSignal, untracked } from '@angular/core';

interface Product {
  id: number;
  name: string;
  price: number;
  defaultColor: string;
  availableColors: string[];
}

@Component({
  selector: 'app-signals-core',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <span class="badge badge-primary">Reactivity Primitives</span>
        <h2>2. Angular Signals Core Primitives</h2>
        <p class="subtitle">
          Interactive practical playground for <code>signal</code>, <code>computed</code>,
          <code>effect</code>, <code>linkedSignal</code>, and <code>untracked</code>.
        </p>
      </div>

      <div class="sections-grid">
        <!-- 1. Writable Signals & Computed -->
        <div class="demo-box">
          <h3>⚡ 1. signal() & computed()</h3>
          <p class="desc">
            Signals are reactive values that notify Angular when they change.
            <code>computed()</code> derives state, memoizes it, and recalculates lazily.
          </p>

          <div class="counter-display">
            <div class="metric">
              <span class="label">Count (signal)</span>
              <span class="val">{{ count() }}</span>
            </div>
            <div class="metric">
              <span class="label">Double (computed)</span>
              <span class="val">{{ doubleCount() }}</span>
            </div>
            <div class="metric">
              <span class="label">Parity (computed)</span>
              <span class="val">{{ parity() }}</span>
            </div>
          </div>

          <div class="btn-group">
            <button class="btn btn-primary" (click)="increment()">+1 (update)</button>
            <button class="btn btn-secondary" (click)="decrement()">-1 (update)</button>
            <button class="btn btn-outline" (click)="resetCount()">Reset to 0 (set)</button>
            <button class="btn btn-outline" (click)="randomCount()">Random</button>
          </div>

          <div class="code-snippet">
            <pre><code>{{ snippet1 }}</code></pre>
          </div>
        </div>

        <!-- 2. linkedSignal() -->
        <div class="demo-box">
          <div class="box-title-row">
            <h3>🔗 2. linkedSignal()</h3>
            <span class="pill-new">Angular Modern Feature</span>
          </div>
          <p class="desc">
            A <strong>writable signal linked to a source signal</strong>. It automatically resets
            when the source changes, but allows manual override by user interaction.
          </p>

          <div class="product-selector">
            <label><strong>Select Product (Source Signal):</strong></label>
            <div class="product-pills">
              @for (prod of products; track prod.id) {
                <button
                  class="pill-btn"
                  [class.active]="selectedProduct().id === prod.id"
                  (click)="selectProduct(prod)"
                >
                  {{ prod.name }} (\${{ prod.price }})
                </button>
              }
            </div>

            <div class="linked-state-box">
              <p>Selected Product: <strong>{{ selectedProduct().name }}</strong></p>
              <p>Default Color: <code>{{ selectedProduct().defaultColor }}</code></p>

              <label class="color-label"><strong>Chosen Color (linkedSignal):</strong></label>
              <div class="color-options">
                @for (c of selectedProduct().availableColors; track c) {
                  <button
                    class="color-btn"
                    [class.selected]="selectedColor() === c"
                    (click)="selectedColor.set(c)"
                  >
                    {{ c }}
                  </button>
                }
              </div>
              <p class="note">
                💡 Notice: If you pick a custom color, and then switch products, <code>selectedColor</code>
                automatically resets to the new product's default, but remains writable!
              </p>
            </div>
          </div>

          <div class="code-snippet">
            <pre><code>{{ snippet2 }}</code></pre>
          </div>
        </div>
      </div>

      <!-- 3. effect() & Activity Log -->
      <div class="effect-section">
        <div class="effect-header">
          <div>
            <h3>📡 3. effect() and untracked()</h3>
            <p class="desc">
              <code>effect()</code> runs side effects when tracked signals change.
              Use <code>untracked()</code> to read a signal without making it a dependency.
            </p>
          </div>
          <button class="btn btn-small" (click)="clearLogs()">Clear Log</button>
        </div>

        <div class="log-console">
          <div class="log-title">Live effect() Execution Console</div>
          @if (effectLogs().length === 0) {
            <div class="empty-log">No logs yet. Interact with the counter or products above to see effect() fire!</div>
          } @else {
            <div class="logs-list">
              @for (log of effectLogs(); track $index) {
                <div class="log-item">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-msg">{{ log.message }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="code-snippet">
          <pre><code>{{ snippet3 }}</code></pre>
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
    .badge-primary { background: #e0e7ff; color: #4338ca; }
    .badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pill-new {
      background: #fdf2f8;
      color: #be185d;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }
    .card-header h2 {
      margin: 0.5rem 0 0.25rem 0;
      color: #0f172a;
    }
    .subtitle { color: #64748b; margin-top: 0; }
    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    @media (max-width: 900px) {
      .sections-grid { grid-template-columns: 1fr; }
    }
    .demo-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    .box-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .demo-box h3 { margin: 0 0 0.25rem 0; color: #1e293b; font-size: 1.1rem; }
    .desc { font-size: 0.85rem; color: #64748b; margin-top: 0; }
    .counter-display {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    .metric {
      flex: 1;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      text-align: center;
    }
    .metric .label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }
    .metric .val {
      font-size: 1.4rem;
      font-weight: 700;
      color: #2563eb;
    }
    .btn-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .btn {
      padding: 0.5rem 0.85rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #2563eb; color: #fff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #64748b; color: #fff; }
    .btn-secondary:hover { background: #475569; }
    .btn-outline { background: #fff; border: 1px solid #cbd5e1; color: #334155; }
    .btn-outline:hover { background: #f1f5f9; }
    .btn-small { padding: 0.3rem 0.6rem; font-size: 0.75rem; background: #e2e8f0; color: #475569; }
    .code-snippet {
      margin-top: auto;
      background: #0f172a;
      border-radius: 6px;
      padding: 0.75rem;
      overflow-x: auto;
    }
    .code-snippet pre {
      margin: 0;
    }
    .code-snippet code {
      font-family: Consolas, monospace;
      font-size: 0.75rem;
      color: #38bdf8;
    }
    .product-pills {
      display: flex;
      gap: 0.5rem;
      margin: 0.5rem 0 1rem 0;
      flex-wrap: wrap;
    }
    .pill-btn {
      border: 1px solid #cbd5e1;
      background: #fff;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .pill-btn.active {
      background: #4338ca;
      color: #fff;
      border-color: #4338ca;
    }
    .linked-state-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.85rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }
    .color-label { display: block; margin: 0.5rem 0 0.35rem 0; }
    .color-options { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
    .color-btn {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .color-btn.selected {
      background: #059669;
      color: white;
      border-color: #059669;
    }
    .note {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0.5rem 0 0 0;
    }
    .effect-section {
      margin-top: 1.5rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1.25rem;
    }
    .effect-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .effect-header h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; color: #1e293b; }
    .log-console {
      background: #0f172a;
      border-radius: 8px;
      padding: 0.85rem;
      margin-bottom: 1rem;
      max-height: 180px;
      overflow-y: auto;
      font-family: monospace;
    }
    .log-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #94a3b8;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .empty-log { color: #64748b; font-size: 0.8rem; font-style: italic; }
    .log-item {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8rem;
      line-height: 1.5;
    }
    .log-time { color: #38bdf8; flex-shrink: 0; }
    .log-msg { color: #f8fafc; }
  `]
})
export class SignalsCoreComponent {
  // 1. Writable Signals
  readonly count = signal(0);

  // 2. Computed Signals
  readonly doubleCount = computed(() => this.count() * 2);
  readonly parity = computed(() => (this.count() % 2 === 0 ? 'EVEN' : 'ODD'));

  // 3. Products dataset
  readonly products: Product[] = [
    { id: 1, name: 'Smart Watch Pro', price: 299, defaultColor: 'Space Gray', availableColors: ['Space Gray', 'Silver', 'Midnight Blue'] },
    { id: 2, name: 'Noise-Canceling Headphones', price: 199, defaultColor: 'Matte Black', availableColors: ['Matte Black', 'Pearl White', 'Rose Gold'] },
    { id: 3, name: 'Mechanical Keyboard', price: 149, defaultColor: 'Classic Gray', availableColors: ['Classic Gray', 'RGB Cyberpunk', 'Retro Cream'] }
  ];

  // 4. Source Signal for linkedSignal demo
  readonly selectedProduct = signal<Product>(this.products[0]);

  // 5. linkedSignal: resets automatically when selectedProduct() changes, but user can override!
  readonly selectedColor = linkedSignal(() => this.selectedProduct().defaultColor);

  // 6. Effect log container
  readonly effectLogs = signal<{ time: string; message: string }[]>([]);

  readonly snippet1 = `// 1. Writable Signal
readonly count = signal(0);

// 2. Computed (Derivation)
readonly doubleCount = computed(() => this.count() * 2);
readonly parity = computed(() => this.count() % 2 === 0 ? 'EVEN' : 'ODD');

// 3. Mutating Signals
this.count.update(c => c + 1); // Functional update
this.count.set(0);             // Direct replacement`;

  readonly snippet2 = `// Source Signal
selectedProduct = signal(products[0]);

// Linked Signal: resets when selectedProduct changes, yet stays writable!
selectedColor = linkedSignal(() => this.selectedProduct().defaultColor);

// User can manually override:
this.selectedColor.set('Red');`;

  readonly snippet3 = `effect((onCleanup) => {
  const currentCount = this.count();
  // Read another signal without triggering this effect when it changes:
  const product = untracked(() => this.selectedProduct().name);

  console.log(\`Count changed to \${currentCount} for \${product}\`);

  // Cleanup runs before next effect execution or component destruction
  onCleanup(() => {
    // Clean timers, subscriptions, DOM listeners
  });
});`;

  constructor() {
    // 7. effect() reacting to count changes
    effect((onCleanup) => {
      const current = this.count();
      // Read product untracked so changes to product don't re-trigger this specific log
      const prodName = untracked(() => this.selectedProduct().name);

      const logEntry = {
        time: new Date().toLocaleTimeString(),
        message: `[effect] count updated to ${current} (Selected product: "${prodName}")`
      };

      // Update log signal
      untracked(() => {
        this.effectLogs.update(logs => [logEntry, ...logs].slice(0, 8));
      });

      onCleanup(() => {
        // Cleanup demonstration
      });
    });

    // 8. effect() reacting to linkedSignal changes
    effect(() => {
      const color = this.selectedColor();
      const prod = this.selectedProduct().name;
      const logEntry = {
        time: new Date().toLocaleTimeString(),
        message: `[effect:linkedSignal] Color set to "${color}" for product "${prod}"`
      };
      untracked(() => {
        this.effectLogs.update(logs => [logEntry, ...logs].slice(0, 8));
      });
    });
  }

  increment() {
    this.count.update(c => c + 1);
  }

  decrement() {
    this.count.update(c => c - 1);
  }

  resetCount() {
    this.count.set(0);
  }

  randomCount() {
    this.count.set(Math.floor(Math.random() * 100));
  }

  selectProduct(prod: Product) {
    this.selectedProduct.set(prod);
  }

  clearLogs() {
    this.effectLogs.set([]);
  }
}
