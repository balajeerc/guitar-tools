/**
 * Set up an accordion toggle that expands/collapses on click
 * and closes when clicking outside.
 */
export function setupAccordionToggle(toggleId: string): void {
  const toggle = document.getElementById(toggleId);
  const wrapper = toggle?.parentElement;
  if (!toggle || !wrapper) return;

  toggle.addEventListener("click", () => {
    wrapper.classList.toggle("expanded");
  });

  document.addEventListener("click", (e: MouseEvent) => {
    if (!wrapper.contains(e.target as Node)) {
      wrapper.classList.remove("expanded");
    }
  });
}
