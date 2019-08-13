// @flow

let size: number = -1;

// This utility copied from "dom-helpers" package.
export function getScrollbarSize(recalculate?: boolean = false): number {
  if (size === -1 || recalculate) {
    const div = document.createElement('div');
    const style = div.style;
    style.width = '50px';
    style.height = '50px';
    style.overflow = 'scroll';

    ((document.body: any): HTMLBodyElement).appendChild(div);

    size = div.offsetWidth - div.clientWidth;

    ((document.body: any): HTMLBodyElement).removeChild(div);
  }

  return size;
}

export type RTLOffsetType =
  | 'negative'
  | 'positive-descending'
  | 'positive-ascending';

let cachedRTLResult: RTLOffsetType | null = null;

// TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
// Chrome does not seem to adhere; its scrollLeft values are positive (measured relative to the left).
// Safari's elastic bounce makes detecting this even more complicated wrt potential false positives.
// The safest way to check this is to intentionally set a negative offset,
// and then verify that the subsequent "scroll" event matches the negative offset.
// If it does not match, then we can assume a non-standard RTL scroll implementation.
export function getRTLOffsetType(recalculate?: boolean = false): RTLOffsetType {
  if (cachedRTLResult === null || recalculate) {
    const outerDiv = document.createElement('div');
    const outerStyle = outerDiv.style;
    outerStyle.width = '50px';
    outerStyle.height = '50px';
    outerStyle.overflow = 'scroll';
    outerStyle.direction = 'rtl';

    const innerDiv = document.createElement('div');
    const innerStyle = innerDiv.style;
    innerStyle.width = '100px';
    innerStyle.height = '100px';

    outerDiv.appendChild(innerDiv);

    ((document.body: any): HTMLBodyElement).appendChild(outerDiv);

    if (outerDiv.scrollLeft > 0) {
      cachedRTLResult = 'positive-descending';
    } else {
      outerDiv.scrollLeft = 1;
      if (outerDiv.scrollLeft === 0) {
        cachedRTLResult = 'negative';
      } else {
        cachedRTLResult = 'positive-ascending';
      }
    }

    ((document.body: any): HTMLBodyElement).removeChild(outerDiv);

    return cachedRTLResult;
  }

  return cachedRTLResult;
}
