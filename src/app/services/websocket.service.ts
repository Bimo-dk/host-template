import { DestroyRef, Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import type { RemoteConfig } from '../types/remote-config';

export type WsMessage =
  | { type: 'welcome'; timestamp: string; clients: number }
  | { type: 'remotes_changed'; timestamp: string; remotes: RemoteConfig[]; trigger: string }
  | { type: 'pong'; timestamp: string };

const MIN_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

@Injectable({ providedIn: 'root' })
export class RegistryWebSocketService implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  readonly connected = signal<boolean>(false);
  readonly remotesChanged$ = new Subject<RemoteConfig[]>();

  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private backoffMs = MIN_BACKOFF_MS;
  private intentionalClose = false;
  private url = '';

  constructor() {
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  connect(url: string): void {
    this.url = url;
    this.intentionalClose = false;
    this.openSocket();
  }

  ngOnDestroy(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close(1000, 'client shutdown');
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
  }

  private openSocket(): void {
    try {
      console.log(`[ws] Connecting to ${this.url}`);
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('[ws] Failed to construct WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.addEventListener('open', () => {
      console.log('[ws] Connected');
      this.connected.set(true);
      this.backoffMs = MIN_BACKOFF_MS;
    });

    this.ws.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse(ev.data) as WsMessage;
        switch (msg.type) {
          case 'welcome':
            console.log(`[ws] Welcome (${msg.clients} clients connected)`);
            break;
          case 'remotes_changed':
            console.log(`[ws] remotes_changed (trigger=${msg.trigger}) — ${msg.remotes.length} remote(s)`);
            this.remotesChanged$.next(msg.remotes);
            break;
          case 'pong':
            break;
        }
      } catch (err) {
        console.error('[ws] Malformed message:', err);
      }
    });

    this.ws.addEventListener('close', (ev) => {
      console.log(`[ws] Closed (code=${ev.code}, reason=${ev.reason || '<none>'})`);
      this.connected.set(false);
      this.ws = null;
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener('error', (ev) => {
      console.error('[ws] Error event', ev);
      // close vil ramme bagefter; ignorer her
    });
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;
    if (this.reconnectTimer !== null) return;
    const delay = this.backoffMs;
    console.log(`[ws] Reconnect in ${delay}ms (next backoff doubles, max ${MAX_BACKOFF_MS}ms)`);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
  }
}
