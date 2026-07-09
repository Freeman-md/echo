let deviceSessionId: string | null = null;

/**
 * Returns one anonymous ID for the lifetime of the current page.
 * It is intentionally not persisted; a future milestone can replace this
 * with an authenticated identity or another durable, server-backed session.
 */
export function getDeviceSessionId(): string {
  if (!deviceSessionId) {
    deviceSessionId = `device_${crypto.randomUUID()}`;
  }

  return deviceSessionId;
}
