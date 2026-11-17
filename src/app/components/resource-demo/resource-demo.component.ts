import { Component, signal, resource } from '@angular/core';

interface UserProfile {
  id: number;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

const MOCK_USERS: Record<number, UserProfile> = {
  1: { id: 1, name: 'Alice Johnson', role: 'Frontend Architect', email: 'alice@example.com', avatar: '👩‍💻' },
  2: { id: 2, name: 'Bob Smith', role: 'Senior Angular Engineer', email: 'bob@example.com', avatar: '👨‍💻' },
  3: { id: 3, name: 'Charlie Davis', role: 'DevOps & Performance Lead', email: 'charlie@example.com', avatar: '🚀' }
};

@Component({
  selector: 'app-resource-demo',
  standalone: true,
  template: `
    <div class="card">
      <div class="card-header">
        <span class="badge badge-cyan">Async Signals</span>
        <h2>5. Modern Async Data: The resource() API</h2>
        <p class="subtitle">
          How to fetch asynchronous data cleanly in Zoneless Angular using Signals without manual RxJS subscriptions or ChangeDetectorRef.
        </p>
      </div>

      <div class="resource-container">
        <div class="controls-bar">
          <label><strong>Select User ID:</strong></label>
          <div class="btn-group">
            <button
              class="btn-tab"
              [class.active]="userId() === 1"
              (click)="userId.set(1)"
            >
              User 1 (Alice)
            </button>
            <button
              class="btn-tab"
              [class.active]="userId() === 2"
              (click)="userId.set(2)"
            >
              User 2 (Bob)
            </button>
            <button
              class="btn-tab"
              [class.active]="userId() === 3"
              (click)="userId.set(3)"
            >
              User 3 (Charlie)
            </button>
          </div>
          <button class="btn btn-reload" (click)="userResource.reload()">
            🔄 Reload Resource
          </button>
        </div>

        <!-- Resource Status Display -->
        <div class="status-indicators">
          <span class="status-pill" [class.active]="userResource.isLoading()">
            Loading: <strong>{{ userResource.isLoading() ? 'true' : 'false' }}</strong>
          </span>
          <span class="status-pill">
            Status: <strong>{{ userResource.status() }}</strong>
          </span>
        </div>

        <!-- Content Area -->
        <div class="result-area">
          @if (userResource.isLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Fetching profile data asynchronously...</span>
            </div>
          } @else if (userResource.error()) {
            <div class="error-state">
              ⚠️ Error loading user: {{ userResource.error() }}
            </div>
          } @else if (userResource.value(); as user) {
            <div class="profile-card">
              <div class="avatar">{{ user.avatar }}</div>
              <div class="details">
                <h3>{{ user.name }}</h3>
                <p class="role">{{ user.role }}</p>
                <p class="email">📧 {{ user.email }}</p>
                <span class="tag-id">User ID: #{{ user.id }}</span>
              </div>
            </div>
          }
        </div>

        <div class="code-box">
          <pre><code>{{ snippetResource }}</code></pre>
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
    .badge-cyan { background: #cffafe; color: #0891b2; }
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
    .resource-container { margin-top: 1.25rem; }
    .controls-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .btn-group { display: flex; gap: 0.5rem; }
    .btn-tab {
      padding: 0.45rem 0.85rem;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .btn-tab.active {
      background: #0891b2;
      color: #ffffff;
      border-color: #0891b2;
      font-weight: 600;
    }
    .btn-reload {
      margin-left: auto;
      padding: 0.45rem 0.85rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.82rem;
    }
    .status-indicators {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .status-pill {
      font-size: 0.8rem;
      background: #f1f5f9;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      color: #475569;
    }
    .status-pill.active {
      background: #fef08a;
      color: #854d0e;
    }
    .result-area {
      min-height: 120px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #0284c7;
      font-weight: 500;
    }
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #bae6fd;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .error-state { color: #dc2626; font-weight: 600; }
    .profile-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      width: 100%;
    }
    .avatar { font-size: 3rem; background: #ffffff; padding: 0.5rem; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    .details h3 { margin: 0 0 0.25rem 0; color: #0f172a; }
    .role { margin: 0 0 0.25rem 0; color: #0284c7; font-weight: 600; font-size: 0.9rem; }
    .email { margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.85rem; }
    .tag-id { font-size: 0.75rem; background: #e2e8f0; padding: 0.2rem 0.5rem; border-radius: 4px; color: #475569; }
    .code-box {
      background: #0f172a;
      border-radius: 6px;
      padding: 0.75rem;
      overflow-x: auto;
    }
    .code-box pre { margin: 0; }
    .code-box code { font-family: Consolas, monospace; font-size: 0.75rem; color: #38bdf8; }
  `]
})
export class ResourceDemoComponent {
  readonly userId = signal<number>(1);

  readonly snippetResource = `// Modern Signal-based asynchronous resource
readonly userId = signal(1);

readonly userResource = resource({
  // 1. Reactive params function
  params: () => ({ id: this.userId() }),

  // 2. Async loader: re-runs whenever params() changes!
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(\`/api/users/\${params.id}\`, { signal: abortSignal });
    return res.json();
  }
});

// In template:
// userResource.isLoading() -> boolean
// userResource.value()     -> loaded data
// userResource.reload()    -> re-triggers loader`;

  // Modern resource() API for asynchronous data loading
  readonly userResource = resource({
    params: () => ({ id: this.userId() }),
    loader: async ({ params, abortSignal }) => {
      // Simulate network latency (600ms)
      await new Promise(resolve => setTimeout(resolve, 600));

      if (abortSignal.aborted) {
        return null;
      }

      const user = MOCK_USERS[params.id];
      if (!user) {
        throw new Error(`User with ID ${params.id} not found`);
      }
      return user;
    }
  });
}
