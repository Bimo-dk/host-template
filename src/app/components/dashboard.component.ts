import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { DynamicNexusService, HealthService } from '@bimo-dk/nexus-runtime';
import { RemoteSlotComponent } from './remote-slot.component';

const TINTS = [
  'linear-gradient(135deg, #dc2626, #f87171)',
  'linear-gradient(135deg, #7c3aed, #a78bfa)',
  'linear-gradient(135deg, #059669, #34d399)',
  'linear-gradient(135deg, #ea580c, #fbbf24)',
  'linear-gradient(135deg, #0891b2, #67e8f9)',
  'linear-gradient(135deg, #db2777, #f472b6)',
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="shop">
      <header class="hero">
        <div class="hero-text">
          <span class="kicker">Nexus Angular Shop</span>
          <h1>Cross-framework retail demo</h1>
          <p class="lead">
            Every product card, cart widget and checkout panel below is loaded from a separate remote
            via Module Federation. Vue, React, and Angular components all render in the same shop without
            sharing a runtime — that's the Bring-Your-Own-Framework pattern.
          </p>
        </div>
        <aside class="hero-stats">
          <div class="stat">
            <span class="stat-label">Loaded remotes</span>
            <strong>{{ nexus.loadedRemotes().length }}</strong>
          </div>
          <div class="stat">
            <span class="stat-label">Failed</span>
            <strong [class.down]="nexus.failedRemotes().size > 0"
                    [class.ok]="nexus.failedRemotes().size === 0">
              {{ nexus.failedRemotes().size }}
            </strong>
          </div>
          <div class="stat">
            <span class="stat-label">Registry</span>
            <strong [class.ok]="nexus.registryOnline()" [class.down]="!nexus.registryOnline()">
              {{ nexus.registryOnline() ? 'live' : 'offline' }}
            </strong>
          </div>
        </aside>
      </header>

      @if (nexus.loadedRemotes().length === 0) {
        <div class="empty">
          <h3>No remotes registered yet</h3>
          <p>Add one via the portal at <a href="http://localhost:8669">localhost:8669</a>.</p>
        </div>
      } @else {
        <h2 class="section-title">Featured products</h2>
        <div class="product-grid">
          @for (r of products(); track r.remote.name + '@' + r.index) {
            <article class="product">
              <div class="product-image" [style.background]="r.tint">
                <span class="badge">{{ $any(r.remote).framework || 'remote' }}</span>
              </div>
              <h3>{{ r.remote.name }} entry</h3>
              <p class="price">$ {{ (29 + r.index * 7).toFixed(2) }}</p>
              <app-remote-slot
                [remoteEntry]="r.remote.url"
                [exposedModule]="r.remote.exposedModule"
                [compact]="true"
              />
            </article>
          }
        </div>

        <h2 class="section-title">Live demo of each remote</h2>
        <div class="demo-stack">
          @for (r of nexus.loadedRemotes(); track r.name) {
            <article class="demo">
              <header>
                <strong>{{ r.name }}</strong>
                <code>/{{ r.routePath }}</code>
                <span class="fw" [attr.data-fw]="$any(r).framework">{{ $any(r).framework }}</span>
              </header>
              <app-remote-slot
                [remoteEntry]="r.url"
                [exposedModule]="r.exposedModule"
              />
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .shop { padding: 0 8px 24px; }
      .hero {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 24px;
        padding: 28px;
        background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%);
        color: white;
        border-radius: 16px;
        margin-bottom: 24px;
      }
      .hero-text .kicker { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.8; }
      .hero-text h1 { margin: 4px 0 12px; font-size: 28px; font-weight: 700; }
      .hero-text .lead { max-width: 60ch; opacity: 0.9; line-height: 1.5; }
      .hero-stats { display: flex; gap: 16px; }
      .stat { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 12px 16px; min-width: 100px; }
      .stat-label { display: block; font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
      .stat strong { font-size: 22px; }
      .stat .ok { color: #6ee7b7; }
      .stat .down { color: #fda4af; }

      .empty {
        padding: 32px;
        background: var(--host-surface);
        border: 1px dashed var(--host-border);
        border-radius: 12px;
        text-align: center;
        color: var(--host-text-muted);
      }

      .section-title {
        margin: 32px 0 16px;
        font-size: 16px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--host-text-muted);
      }

      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .product {
        background: var(--host-surface);
        border: 1px solid var(--host-border);
        border-radius: 14px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .product-image { aspect-ratio: 1.4; position: relative; }
      .product-image .badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-size: 11px;
        padding: 4px 10px;
        border-radius: 999px;
        text-transform: uppercase;
      }
      .product h3 { margin: 12px 16px 4px; font-size: 14px; }
      .product .price { margin: 0 16px 12px; color: var(--host-primary-dark); font-weight: 700; }

      .demo-stack { display: grid; gap: 16px; }
      .demo {
        background: var(--host-surface);
        border: 1px solid var(--host-border);
        border-radius: 14px;
        overflow: hidden;
      }
      .demo > header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        background: #fef2f2;
        border-bottom: 1px solid var(--host-border);
      }
      .demo > header code { color: var(--host-text-muted); font-size: 12px; }
      .demo .fw {
        margin-left: auto;
        font-size: 11px;
        text-transform: uppercase;
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 700;
        background: #e5e7eb;
        color: #374151;
      }
      .demo .fw[data-fw="angular"] { background: #fee2e2; color: #b91c1c; }
      .demo .fw[data-fw="vue"]     { background: #dcfce7; color: #14532d; }
      .demo .fw[data-fw="react"]   { background: #dbeafe; color: #1e40af; }
    `,
  ],
  imports: [RemoteSlotComponent],
})
export class DashboardComponent {
  readonly nexus = inject(DynamicNexusService);
  private readonly health = inject(HealthService);

  readonly products = computed(() =>
    this.nexus
      .loadedRemotes()
      .slice(0, 6)
      .map((remote, index) => ({ remote, index, tint: TINTS[index % TINTS.length] })),
  );

  healthStatusFor(name: string): string {
    return this.health.remoteHealth().get(name) ?? 'unknown';
  }
}
