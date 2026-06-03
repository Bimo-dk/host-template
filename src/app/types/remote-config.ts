// MIGRATION: alle typer kommer nu fra @bimo-nexus/core.
// Denne fil re-eksporterer for at undgå at ændre alle imports i host's source — ny kode bør importere direkte fra '@bimo-nexus/core'.
export type {
  RemoteHealthStatus,
  RemoteConfig,
  RegistryResponse,
  HealthStatus,
  WebSocketMessage,
} from '@bimo-nexus/core';
