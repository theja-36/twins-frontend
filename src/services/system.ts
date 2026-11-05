import { load } from "./trading";
import type { AgentsStatus, AppNotification, HealthStatus, IntakeStatus, MarketSnapshot, Readiness, SystemConfig } from "@/types/trading";

/** Fetchers for the system views. Same rules as trading.ts: GET through the proxy; no sample data. */
export const getHealth = () => load<HealthStatus>("health/status");
export const getAgentsStatus = () => load<AgentsStatus>("agents/status?limit=50");
export interface NotificationFeed { items: AppNotification[]; unavailableSources: string[] }
export const getNotifications = (limit = 100) => load<NotificationFeed>(`notifications?limit=${limit}`, (r) => (Array.isArray(r.notifications) ? { items: r.notifications, unavailableSources: Array.isArray(r.unavailableSources) ? r.unavailableSources : [] } : null));
export const getSystemConfig = () => load<SystemConfig>("system/config");
export const getIntakeStatus = (limit = 25) => load<IntakeStatus>(`intake/status?limit=${limit}`);
export const getMarketSnapshot = () => load<MarketSnapshot>("market/snapshot");
export const getReadiness = () => load<Readiness>("paper/readiness");

/** Reads a control as true / false / undefined (undefined = the backend did not say). Never defaults to a "safe-looking" answer. */
export const controlOf = (rc: { tradingEnabled?: boolean; intakeEnabled?: boolean; killSwitchActive?: boolean } | null | undefined, key: "tradingEnabled" | "intakeEnabled" | "killSwitchActive"): boolean | undefined => (typeof rc?.[key] === "boolean" ? rc[key] : undefined);
