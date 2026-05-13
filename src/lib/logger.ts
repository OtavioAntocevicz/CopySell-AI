/** @module src/lib/logger.ts */

type LogPayload = Record<string, unknown>;

export function logServerInfo(event: string, payload: LogPayload) {
  console.info(JSON.stringify({ level: "info", event, ...payload }));
}

export function logServerWarn(event: string, payload: LogPayload) {
  console.warn(JSON.stringify({ level: "warn", event, ...payload }));
}

export function logServerError(event: string, payload: LogPayload) {
  console.error(JSON.stringify({ level: "error", event, ...payload }));
}
