/** SISTEM › Pengaturan platform — Token Domain spec §26. */
export type PlatformSettings = {
  accessTokenTtlMinutes: number
  refreshTokenTtlDays: number
  refreshRotationEnabled: boolean
  maxConcurrentSessions: number
  housekeepingRetentionDays: number
}

export const defaultPlatformSettings: PlatformSettings = {
  accessTokenTtlMinutes: 15,
  refreshTokenTtlDays: 30,
  refreshRotationEnabled: true,
  maxConcurrentSessions: 5,
  housekeepingRetentionDays: 180,
}
