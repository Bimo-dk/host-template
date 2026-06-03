import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DynamicNexusService } from './services/dynamic-nexus.service';
import { RegistryService } from './services/registry.service';
import { HealthService } from './services/health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      @if (!nexus.registryOnline()) {
        <div class="offline-banner">
          <span class="icon">⚠</span>
          <strong>Registry offline</strong> — showing data from
          <code>{{ registry.lastSource() }}</code>
          (cache or static backup). New remotes cannot be registered until the connection is restored.
        </div>
      }

      <header class="topbar">
        <div class="brand">
          <span class="dot"></span>
          <strong>Nexus Host</strong>
        </div>
        <nav class="topnav">
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        </nav>
        <div class="meta">
          <span class="pill" [class.online]="nexus.registryOnline()" [class.offline]="!nexus.registryOnline()">
            Registry {{ nexus.registryOnline() ? 'online' : 'offline' }}
          </span>
        </div>
      </header>

      <div class="body">
        <aside class="sidebar">
          <h3>Remotes</h3>

          @if (nexus.loadedRemotes().length === 0) {
            <p class="empty-side">No active remotes.</p>
          }

          <ul>
            @for (r of nexus.loadedRemotes(); track r.name) {
              <li>
                <a [routerLink]="['/', r.routePath]" routerLinkActive="active">
                  <span class="status-dot" [attr.data-status]="healthStatus(r.name)"></span>
                  <span class="name">{{ r.name }}</span>
                </a>
              </li>
            }
          </ul>

          @if (nexus.failedRemotes().size > 0) {
            <h4>Failed remotes</h4>
            <ul class="failed">
              @for (entry of failedRemotesList(); track entry.name) {
                <li title="{{ entry.error }}">
                  <span class="status-dot" data-status="down"></span>
                  {{ entry.name }}
                </li>
              }
            </ul>
          }
        </aside>

        <main class="content">
          <router-outlet />
        </main>
      </div>

      <footer class="bottombar">
        <small>Nexus host shell — {{ nexus.loadedRemotes().length }} remotes loaded</small>
      </footer>
    </div>
  `,
  styles: [
    `
      :host { display: block; height: 100vh; }
      .layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .topbar { flex: 0 0 56px; }
      .body { flex: 1 1 auto; min-height: 0; }
      .bottombar { flex: 0 0 32px; }
      .offline-banner {
        flex: 0 0 auto;
        background: #fef3c7;
        color: #78350f;
        padding: 10px 20px;
        border-bottom: 1px solid #fbbf24;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .offline-banner .icon { font-size: 16px; }
      .offline-banner code {
        background: rgba(120, 53, 15, 0.1);
        padding: 1px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Menlo, monospace;
        font-size: 12px;
      }
      .topbar {
        display: flex;
        align-items: center;
        gap: 32px;
        padding: 0 24px;
        background: var(--host-surface);
        border-bottom: 1px solid var(--host-border);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 16px;
        color: var(--host-text);
      }
      .brand .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--host-primary);
      }
      .topnav { display: flex; gap: 16px; flex: 1; }
      .topnav a {
        color: var(--host-text-muted);
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 14px;
      }
      .topnav a.active { color: var(--host-primary-dark); background: #eef2ff; }
      .meta .pill {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 999px;
        font-weight: 600;
        background: #f1f5f9;
        color: var(--host-text-muted);
      }
      .meta .pill.online { background: #dcfce7; color: #166534; }
      .meta .pill.offline { background: #fee2e2; color: #991b1b; }

      .body { display: grid; grid-template-columns: 240px 1fr; min-height: 0; }
      .sidebar {
        background: var(--host-surface);
        border-right: 1px solid var(--host-border);
        padding: 16px;
        overflow-y: auto;
      }
      .sidebar h3 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--host-text-muted);
        margin: 0 0 8px;
      }
      .sidebar h4 {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--health-down);
        margin: 16px 0 8px;
      }
      .empty-side { color: var(--host-text-muted); font-size: 13px; }
      .sidebar ul { list-style: none; padding: 0; margin: 0; }
      .sidebar li { margin-bottom: 4px; }
      .sidebar a {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 6px;
        color: var(--host-text);
        text-decoration: none;
        font-size: 14px;
      }
      .sidebar a:hover { background: #f1f5f9; text-decoration: none; }
      .sidebar a.active { background: #eef2ff; color: var(--host-primary-dark); }
      .sidebar .failed li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 10px;
        font-size: 13px;
        color: var(--health-down);
      }
      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--health-unknown);
        flex-shrink: 0;
      }
      .status-dot[data-status="healthy"] { background: var(--health-healthy); }
      .status-dot[data-status="degraded"] { background: var(--health-degraded); }
      .status-dot[data-status="down"] { background: var(--health-down); }

      .content {
        padding: 24px;
        overflow-y: auto;
      }
      .bottombar {
        background: var(--host-surface);
        border-top: 1px solid var(--host-border);
        padding: 0 24px;
        display: flex;
        align-items: center;
        color: var(--host-text-muted);
        font-size: 12px;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  readonly nexus = inject(DynamicNexusService);
  readonly registry = inject(RegistryService);
  private readonly health = inject(HealthService);

  ngOnInit(): void {
    this.health.start();
  }

  healthStatus(name: string): string {
    return this.health.remoteHealth().get(name) ?? 'unknown';
  }

  failedRemotesList(): Array<{ name: string; error: string }> {
    return Array.from(this.nexus.failedRemotes().entries()).map(([name, error]) => ({ name, error }));
  }
}
