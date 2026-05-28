// Small DOM helpers

/** Toggle the "active" class on an element by id */
export function setButtonActive(id: string, active: boolean): void {
  document.getElementById(id)?.classList.toggle("active", active);
}
