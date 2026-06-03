import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DynamicNexusService } from '../services/dynamic-nexus.service';
import { HealthService } from '../services/health.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="dashboard">
      <h2>Welcome to the Nexus host shell</h2>
      <p class="lead">Select a remote in the sidebar to load a micro frontend.</p>

      @if (nexus.loadedRemotes().length === 0) {
        <div class="empty">
          <h3>No remotes registered yet</h3>
          <p>Host receives updates from the registry via WebSocket.
            Add a remote via the manager app at <code>http://localhost:8669</code>.</p>
        </div>
      } @else {
        <div class="stats">
          <article class="card">
            <span class="label">Loaded remotes</span>
            <strong>{{ nexus.loadedRemotes().length }}</strong>
          </article>
          <article class="card">
            <span class="label">Failed remotes</span>
            <strong>{{ nexus.failedRemotes().size }}</strong>
          </article>
          <article class="card">
            <span class="label">Registry</span>
            <strong [class.online]="nexus.registryOnline()" [class.offline]="!nexus.registryOnline()">
              {{ nexus.registryOnline() ? 'Online' : 'Offline (cache)' }}
            </strong>
          </article>
        </div>

        <h3>Available remotes</h3>
        <ul class="remote-list">
          @for (r of nexus.loadedRemotes(); track r.name) {
            <li>
              <a [routerLink]="['/', r.routePath]">
                <span class="status-dot" [attr.data-status]="healthStatusFor(r.name)"></span>
                <strong>{{ r.name }}</strong>
                <code>/{{ r.routePath }}</code>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [
    `
      .dashboard { padding: 8px; }
      h2 { margin: 0 0 4px; color: var(--host-text); }
      .lead { color: var(--host-text-muted); margin: 0 0 24px; }
      h3 { margin: 24px 0 12px; font-size: 16px; color: var(--host-text); }
      .empty {
        padding: 32px;
        background: var(--host-surface);
        border: 1px dashed var(--host-border);
        border-radius: 12px;
        text-align: center;
        color: var(--host-text-muted);
      }
      .empty h3 { margin: 0 0 8px; color: var(--host-text); }
      .empty code {
        background: #eef2ff;
        padding: 2px 6px;
        border-radius: 4px;
        color: var(--host-primary-dark);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }
      .card {
        background: var(--host-surface);
        border: 1px solid var(--host-border);
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
      }
      .card .label { font-size: 12px; color: var(--host-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      .card strong { font-size: 24px; margin-top: 4px; }
      .card strong.online { color: var(--health-healthy); }
      .card strong.offline { color: var(--health-down); }
      .remote-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
      .remote-list a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--host-surface);
        border: 1px solid var(--host-border);
        border-radius: 10px;
        color: var(--host-text);
        text-decoration: none;
        transition: border-color 0.15s;
      }
      .remote-list a:hover { border-color: var(--host-primary); text-decoration: none; }
      .remote-list code { color: var(--host-text-muted); font-size: 13px; margin-left: auto; }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--health-unknown);
        flex-shrink: 0;
      }
      .status-dot[data-status="healthy"] { background: var(--health-healthy); }
      .status-dot[data-status="degraded"] { background: var(--health-degraded); }
      .status-dot[data-status="down"] { background: var(--health-down); }
    `,
  ],
  imports: [RouterLink],
})
export class DashboardComponent {
  readonly nexus = inject(DynamicNexusService);
  private readonly health = inject(HealthService);

  healthStatusFor(name: string): string {
    return this.health.remoteHealth().get(name) ?? 'unknown';
  }
}
