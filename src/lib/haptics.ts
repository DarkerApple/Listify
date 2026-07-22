// Tiny wrapper around the Vibration API. A no-op where unsupported (desktop,
// iOS Safari) so callers never need to feature-check.

export function tick(): void {
  navigator.vibrate?.(8);
}

export function thunk(): void {
  navigator.vibrate?.([12, 20, 24]); // reserved for the seal stamp (Stage 2)
}
