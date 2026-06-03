export const environment = {
  production: false,
  registryUrl: '/api',
  registryWsPath: '/ws',
  nexusToken: 'change-this-to-a-strong-secret-in-production',
  staticBackupUrl: '/registry-backup/remotes.json',
  cacheTtlMs: 24 * 60 * 60 * 1000, // 24 timer
  healthCheckIntervalMs: 30000,
};
