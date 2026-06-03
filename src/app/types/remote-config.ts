// MIGRATION: all types now come from @bimo-dk/nexus-core.
// This file re-exports to avoid changing all imports in the host's source — new code should import directly from '@bimo-dk/nexus-core'.
export type {
  RemoteHealthStatus,
  RemoteConfig,
  RegistryResponse,
  HealthStatus,
  WebSocketMessage,
} from '@bimo-dk/nexus-core';
