/* =============================================================================
   ENV — piccole utility d'ambiente condivise
   ============================================================================= */

/** Rispetta l'impostazione di sistema "riduci movimento" (principi 3D §5). */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Touch / nessun hover: per disattivare cursore custom ed effetti puntatore. */
export function isTouch() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(hover: none)').matches
  );
}
