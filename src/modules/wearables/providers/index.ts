// Provider resolver — returns the right HealthProvider for the current runtime.
//
// In a browser this is the web stub (no bridge to HealthKit/Health Connect
// exists in a PWA). Inside the native Capacitor shell, the KarawhiuaHealth
// plugin is registered on the webview and the bridge provider takes over —
// no other file in the app changes between the two runtimes.

import type { HealthProvider } from "../types";
import { webProvider } from "./webProvider";
import { capacitorProvider, hasNativeHealthBridge } from "./capacitorProvider";

export const getHealthProvider = (): HealthProvider => {
  if (hasNativeHealthBridge()) return capacitorProvider;
  return webProvider;
};
