// Layout configuration for responsive fretboard rendering

import {
  FRET_WIDTH,
  NUT_POSITION,
  TOTAL_FRETS,
} from "./constants";

export const MOBILE_BREAKPOINT = 767;

const DESKTOP_FRETBOARD_MIN_LENGTH = 1400;
const DESKTOP_FRETBOARD_PADDING = 40;

export interface LayoutConfig {
  readonly isVertical: boolean;
  /** CSS property for positioning along frets: 'left' (horizontal) or 'top' (vertical) */
  readonly fretAxis: "left" | "top";
  /** CSS property for positioning across strings: 'top' (horizontal) or 'left' (vertical) */
  readonly stringAxis: "top" | "left";
  /** CSS dimension along frets: 'width' (horizontal) or 'height' (vertical) */
  readonly fretDimension: "width" | "height";
  /** CSS property for string line thickness: 'height' (horizontal) or 'width' (vertical) */
  readonly stringThicknessProp: "height" | "width";
  /** Length of the open-string area along the fret axis. */
  readonly nutPosition: number;
  /** Width/height of one fret along the fret axis. */
  readonly fretWidth: number;
  /** Total board length from the open-string edge through fret 22. */
  readonly fretboardLength: number;
  /** Combined padding around the fret axis inside its desktop container. */
  readonly fretboardContainerPadding: number;
}

const VERTICAL_CONFIG: LayoutConfig = {
  isVertical: true,
  fretAxis: "top",
  stringAxis: "left",
  fretDimension: "height",
  stringThicknessProp: "width",
  nutPosition: NUT_POSITION,
  fretWidth: FRET_WIDTH,
  fretboardLength: NUT_POSITION + TOTAL_FRETS * FRET_WIDTH,
  fretboardContainerPadding: 0,
};

const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function isMobileLayout(): boolean {
  return window.matchMedia(mobileQuery).matches;
}

export function getLayoutConfig(): LayoutConfig {
  if (isMobileLayout()) return VERTICAL_CONFIG;

  const containerWidth =
    document.querySelector<HTMLElement>(".container")?.clientWidth ??
    DESKTOP_FRETBOARD_MIN_LENGTH + DESKTOP_FRETBOARD_PADDING;
  const fretboardLength = Math.max(
    DESKTOP_FRETBOARD_MIN_LENGTH,
    containerWidth - DESKTOP_FRETBOARD_PADDING,
  );

  return {
    isVertical: false,
    fretAxis: "left",
    stringAxis: "top",
    fretDimension: "width",
    stringThicknessProp: "height",
    nutPosition: NUT_POSITION,
    fretWidth: (fretboardLength - NUT_POSITION) / TOTAL_FRETS,
    fretboardLength,
    fretboardContainerPadding: DESKTOP_FRETBOARD_PADDING,
  };
}

/** Re-render fretboard geometry when its shared page container changes size. */
export function observeFretboardResize(callback: () => void): void {
  const container = document.querySelector<HTMLElement>(".container");
  if (!container) return;

  let previousWidth = container.clientWidth;
  const observer = new ResizeObserver(([entry]) => {
    const width = entry.contentRect.width;
    if (width === previousWidth) return;
    previousWidth = width;
    callback();
  });
  observer.observe(container);
}
