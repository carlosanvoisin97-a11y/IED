/* =============================================================================
   REVEAL — ingressi allo scroll con IntersectionObserver (principi 3D §4)
   Aggiunge `.is-in` agli elementi [data-reveal] quando entrano in vista.
   Durata propria e costante (definita in CSS), NON legata alla velocità di
   scroll. Stagger leggero via data-reveal-delay (ms).
   ============================================================================= */

export function initReveal(root = document) {
  const items = root.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  // Se non c'è IntersectionObserver, mostra tutto subito (progressive enhancement)
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.revealDelay || 0);
        el.style.transitionDelay = `${delay}ms`;
        el.classList.add('is-in');
        io.unobserve(el); // una volta sola: ciò che si vede spesso non si rianima (§3)
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  items.forEach((el) => io.observe(el));
}
