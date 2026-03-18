// Layout configuration for responsive fretboard rendering

export const MOBILE_BREAKPOINT = 767;

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
}

const HORIZONTAL_CONFIG: LayoutConfig = {
  isVertical: false,
  fretAxis: "left",
  stringAxis: "top",
  fretDimension: "width",
  stringThicknessProp: "height",
};

const VERTICAL_CONFIG: LayoutConfig = {
  isVertical: true,
  fretAxis: "top",
  stringAxis: "left",
  fretDimension: "height",
  stringThicknessProp: "width",
};

const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT}px)`;

function isMobileLayout(): boolean {
  return window.matchMedia(mobileQuery).matches;
}

export function getLayoutConfig(): LayoutConfig {
  return isMobileLayout() ? VERTICAL_CONFIG : HORIZONTAL_CONFIG;
}
