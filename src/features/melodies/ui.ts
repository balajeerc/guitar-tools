export type Accidental = "" | "b" | "#";

export function setText(id: string, text: string): void {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

export function setDisabled(id: string, disabled: boolean): void {
  const button = document.getElementById(id) as HTMLButtonElement | null;
  if (button) button.disabled = disabled;
}

export function setHidden(id: string, hidden: boolean): void {
  const element = document.getElementById(id);
  if (element) element.hidden = hidden;
}

export function setPressed(id: string, pressed: boolean): void {
  const button = document.getElementById(id);
  button?.classList.toggle("active", pressed);
  button?.setAttribute("aria-pressed", String(pressed));
}

export function formatTime(milliseconds: number): string {
  const tenths = Math.floor(milliseconds / 100) % 10;
  const totalSeconds = Math.floor(milliseconds / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

export function formatDegree(degree: string): string {
  return degree.replace("b", "♭").replace("#", "♯");
}

export function accidentalSymbol(degree: string): string {
  if (degree.startsWith("b")) return "♭";
  if (degree.startsWith("#")) return "♯";
  return "";
}

export function accidentalName(degree: string): string {
  if (degree.startsWith("b")) return "flat";
  if (degree.startsWith("#")) return "sharp";
  return "natural";
}

export function accidentalPrefix(degree: string): Accidental {
  if (degree.startsWith("b")) return "b";
  if (degree.startsWith("#")) return "#";
  return "";
}

export function intervalAnswerHtml(degrees: readonly string[], label = "Correct intervals"): string {
  const boxes = degrees
    .map((degree) => `<span>${formatDegree(degree)}</span>`)
    .join('<i aria-hidden="true">–</i>');
  return `<div class="melodies-answer"><b>${label}</b><div>${boxes}</div></div>`;
}
