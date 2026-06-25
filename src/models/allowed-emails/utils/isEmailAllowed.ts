/**
 * Fail-closed gate: only an explicit `true` from the RPC means "allowed".
 * null/undefined (RPC error or disabled allow-list returning nothing) → blocked.
 */
export const isEmailAllowedResult = (rpcData: boolean | null | undefined): boolean =>
  rpcData === true;
