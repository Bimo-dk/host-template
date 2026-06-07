import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { loadRemoteModule } from '@angular-architects/native-federation';

/**
 * Generic per-card mount slot — loads a remote's `mount(el)` and hands
 * it our div. Used by the Angular shop's product grid and demo stack
 * so the dashboard never imports federation runtime directly. Falls
 * back to a clear error message when a remote does not export a
 * mount function (e.g. legacy Angular-only remotes).
 */
@Component({
  selector: 'app-remote-slot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error) {
      <div class="err">{{ error }}</div>
    } @else {
      <div #root></div>
    }
  `,
  styles: [
    `:host { display: block; padding: 16px; }`,
    `:host([compact]) { padding: 8px; max-height: 220px; overflow: hidden; }`,
    `.err { color: #b91c1c; background: #fee2e2; padding: 8px; font-size: 12px; border-radius: 6px; }`,
  ],
})
export class RemoteSlotComponent implements AfterViewInit, OnDestroy {
  @Input() remoteEntry!: string;
  @Input() exposedModule!: string;
  @Input() compact = false;

  @ViewChild('root', { read: ElementRef })
  rootEl?: ElementRef<HTMLElement>;

  error: string | null = null;
  private teardown?: () => void;

  async ngAfterViewInit(): Promise<void> {
    if (!this.rootEl) return;
    try {
      const mod = (await loadRemoteModule({
        remoteEntry: this.remoteEntry,
        exposedModule: this.exposedModule,
      })) as Record<string, unknown>;
      const mountFn = mod['mount'] as ((el: HTMLElement) => void | (() => void)) | undefined;
      if (typeof mountFn === 'function') {
        const result = mountFn(this.rootEl.nativeElement);
        if (typeof result === 'function') this.teardown = result;
      } else {
        this.error = 'Remote does not export mount(el)';
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  ngOnDestroy(): void {
    this.teardown?.();
  }
}
