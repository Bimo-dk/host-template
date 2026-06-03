import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, defer, from, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import type { RegistryResponse, RemoteConfig } from '../types/remote-config';

interface CacheEntry {
  timestamp: number;
  remotes: RemoteConfig[];
}

const CACHE_KEY = 'federation_remotes_cache_v2';

@Injectable({ providedIn: 'root' })
export class RegistryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.registryUrl}/remotes`;

  // True if the latest HTTP fetch succeeded. Used by DynamicFederationService for online status.
  readonly lastFetchOk = signal<boolean>(true);
  readonly lastSource = signal<'live' | 'cache' | 'backup' | 'empty'>('live');

  /**
   * Fetch enabled remotes with a fallback chain:
   *   1. Live API call to registry
   *   2. localStorage cache (max 24h old)
   *   3. Static backup file served by host's nginx
   *   4. Empty list
   */
  getEnabledRemotes(): Observable<RemoteConfig[]> {
    return this.http.get<RegistryResponse>(this.baseUrl).pipe(
      map((res) => res.remotes.filter((r) => r.enabled)),
      tap((enabled) => {
        this.lastFetchOk.set(true);
        this.lastSource.set('live');
        this.writeCache(enabled);
      }),
      catchError((err: HttpErrorResponse) => {
        this.lastFetchOk.set(false);
        console.error(
          `[registry] Live fetch failed (status=${err.status}). Trying cache -> backup.`,
        );
        return this.fallbackChain();
      }),
    );
  }

  private fallbackChain(): Observable<RemoteConfig[]> {
    const cached = this.readCache();
    if (cached.length > 0) {
      this.lastSource.set('cache');
      console.warn(`[registry] Using localStorage cache (${cached.length} remotes)`);
      return of(cached);
    }
    return defer(() => from(this.loadStaticBackup())).pipe(
      tap((backup) => {
        if (backup.length > 0) {
          this.lastSource.set('backup');
          console.warn(`[registry] Using static backup file (${backup.length} remotes)`);
        } else {
          this.lastSource.set('empty');
          console.error('[registry] No fallback data available — empty list');
        }
      }),
    );
  }

  private async loadStaticBackup(): Promise<RemoteConfig[]> {
    try {
      const res = await fetch(environment.staticBackupUrl, { cache: 'no-cache' });
      if (!res.ok) return [];
      const json = (await res.json()) as { remotes?: RemoteConfig[] };
      return (json.remotes ?? []).filter((r) => r.enabled);
    } catch (err) {
      console.error('[registry] Static backup fetch failed:', err);
      return [];
    }
  }

  private readCache(): RemoteConfig[] {
    try {
      const raw = globalThis.localStorage?.getItem(CACHE_KEY);
      if (!raw) return [];
      const entry = JSON.parse(raw) as CacheEntry;
      const age = Date.now() - entry.timestamp;
      if (age > environment.cacheTtlMs) {
        console.warn(`[registry] Cache expired (age ${Math.round(age / 1000)}s > TTL ${Math.round(environment.cacheTtlMs / 1000)}s)`);
        return [];
      }
      return entry.remotes;
    } catch {
      return [];
    }
  }

  private writeCache(remotes: RemoteConfig[]): void {
    try {
      const entry: CacheEntry = { timestamp: Date.now(), remotes };
      globalThis.localStorage?.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      /* localStorage unavailable — ignore */
    }
  }
}
