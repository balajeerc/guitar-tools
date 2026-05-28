// Reusable "Reset" link button for control/param panels

export function createResetLink(onReset: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "reset-link";
  button.textContent = "Reset";
  button.addEventListener("click", onReset);
  return button;
}
