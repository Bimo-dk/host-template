// MIGRATION: alle typer kommer nu fra @bimo-dk/nexus-core.
// Denne fil re-eksporterer for at undgå at ændre alle imports i host's source — ny kode bør importere direkte fra '@bimo-dk/nexus-core'.
export type {
  RemoteHealthStatus,
  RemoteConfig,
  RegistryResponse,
  HealthStatus,
  WebSocketMessage,
} from '@bimo-dk/nexus-core';
