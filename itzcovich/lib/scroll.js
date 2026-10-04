/**
 * Tiny shared store between the DOM (scroll, pointer, UI state) and the WebGL
 * world. Mutated in place — the render loop reads it every frame, no re-renders.
 */
export const scroll = {
  y: 0,
  vh: 1,
  anchors: [],      // [{ name, start, end }] in scroll px, page order
  pointer: { x: 0, y: 0 },
  activeArea: 0,
  reduced: false,
  mobile: false,
};
