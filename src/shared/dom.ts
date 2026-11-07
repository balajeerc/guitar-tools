// Small DOM helpers

/** Toggle the "active" class on an element by id */
export function setButtonActive(id: string, active: boolean): void {
  document.getElementById(id)?.classList.toggle('active', active);
}

/** Attach named control actions, including controls omitted from a layout. */
export function bindClickActions(
  actions: Readonly<Record<string, (event: MouseEvent) => void>>
): void {
  for (const [id, action] of Object.entries(actions)) {
    document.getElementById(id)?.addEventListener('click', action);
  }
}
