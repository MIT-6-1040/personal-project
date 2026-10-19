import type { ValidationResult } from "@mit-sdg/sync-engine/boundary";

// Lists are sent ten stories at a time, and the page asks for more as you scroll.
export const pageSize = 10;

// Checks the offset before it reaches a query, since queries can't refuse.
export function validOffset(value: unknown): ValidationResult {
  const { offset } = (value ?? {}) as { offset?: unknown };
  if (offset === undefined) return { ok: true };
  if (typeof offset === "number" && Number.isInteger(offset) && offset >= 0) return { ok: true };
  return { ok: false, detail: "offset must be a whole number of 0 or more" };
}
