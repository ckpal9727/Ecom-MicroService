import { Component, inject, signal } from '@angular/core';
import { ZoneExplainerComponent } from './components/zone-explainer/zone-explainer.component';
import { SignalsCoreComponent } from './components/signals-core/signals-core.component';
import { ZonelessLabComponent } from './components/zoneless-lab/zoneless-lab.component';
import { ParentChildDemoComponent } from './components/signal-components/parent-child.component';
import { ResourceDemoComponent } from './components/resource-demo/resource-demo.component';
import { ZoneInspectorService } from './services/zone-inspector.service';

export type TabType = 'all' | 'zone' | 'signals' | 'lab' | 'components' | 'resource';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ZoneExplainerComponent,
    SignalsCoreComponent,
    ZonelessLabComponent,
    ParentChildDemoComponent,
    ResourceDemoComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private zoneInspector = inject(ZoneInspectorService);

  readonly currentTab = signal<TabType>('all');
  readonly isZoneLoaded = this.zoneInspector.isZoneLoaded;
  readonly cdTickCount = this.zoneInspector.cdTickCount;

  setTab(tab: TabType) {
    this.currentTab.set(tab);
  }
}
