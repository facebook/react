/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import assign from 'object-assign';
import {getElementDimensions, getNestedBoundingClientRect} from '../utils';

import type {DevToolsHook} from 'react-devtools-shared/src/backend/types';
import type {Rect} from '../utils';

import type {Data} from './index';
import type {NativeType} from '../../types';

const OUTLINE_COLOR = '#f0f0f0';

const COLORS = [
  '#37afa9',
  '#63b19e',
  '#80b393',
  '#97b488',
  '#abb67d',
  '#beb771',
  '#cfb965',
  '#dfba57',
  '#efbb49',
  '#febc38',
];
const highlightStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};

type Box = {|top: number, left: number, width: number, height: number|};

class OverlayTip {
  tip: HTMLElement;
  nameSpan: HTMLElement;
  dimSpan: HTMLElement;

  constructor(doc: Document, container: HTMLElement) {
    this.tip = doc.createElement('div');
    assign(this.tip.style, {
      display: 'flex',
      flexFlow: 'row nowrap',
      backgroundColor: '#333740',
      borderRadius: '2px',
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontWeight: 'bold',
      padding: '3px 5px',
      pointerEvents: 'none',
      position: 'fixed',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);
    assign(this.nameSpan.style, {
      color: '#ee78e6',
      borderRight: '1px solid #aaaaaa',
      paddingRight: '0.5rem',
      marginRight: '0.5rem',
    });
    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);
    assign(this.dimSpan.style, {
      color: '#d7d7d7',
    });

    this.tip.style.zIndex = '10000000';
    container.appendChild(this.tip);
  }

  remove() {
    if (this.tip.parentNode) {
      this.tip.parentNode.removeChild(this.tip);
    }
  }

  updateText(name: string, width: number, height: number) {
    this.nameSpan.textContent = name;
    this.dimSpan.textContent =
      Math.round(width) + 'px × ' + Math.round(height) + 'px';
  }

  updatePosition(dims: Box, bounds: Box) {
    const tipRect = this.tip.getBoundingClientRect();
    const tipPos = findTipPos(dims, bounds, {
      width: tipRect.width,
      height: tipRect.height,
    });
    assign(this.tip.style, tipPos.style);
  }
}

export default class Canvas {
  window: window;
  tipBoundsWindow: window;
  container: HTMLElement;
  tip: OverlayTip;

  constructor() {
    const canvas: HTMLCanvasElement | null = null;
    this.canvas = canvas;
    // Find the root window, because overlays are positioned relative to it.
    const currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;
    this.window = currentWindow;

    // When opened in shells/dev, the tooltip should be bound by the app iframe, not by the topmost window.
    const tipBoundsWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;
    this.tipBoundsWindow = tipBoundsWindow;

    const doc = currentWindow.document;
    this.container = doc.createElement('div');
    this.container.style.zIndex = '10000000';

    this.tip = new OverlayTip(doc, this.container);

    doc.body.appendChild(this.container);
  }

  initialize(): void {
    this.canvas = window.document.createElement('canvas');
    this.canvas.style.cssText = `
    xx-background-color: red;
    xx-opacity: 0.5;
    bottom: 0;
    left: 0;
    pointer-events: none;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000000000;
  `;

    const root = window.document.documentElement;
    root.insertBefore(this.canvas, root.firstChild);
  }

  inspect(nodes: Array<HTMLElement>, name?: ?string): void {
    if (this.canvas === null) {
      this.initialize();
    }

    const canvasFlow: HTMLCanvasElement = ((this.canvas: any): HTMLCanvasElement);
    canvasFlow.width = window.innerWidth;
    canvasFlow.height = window.innerHeight;

    const context = canvasFlow.getContext('2d');
    context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);

    const elements = nodes.filter(node => node.nodeType === Node.ELEMENT_NODE);

    const outerBox = {
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
    };
    elements.forEach((element, index) => {
      const box = getNestedBoundingClientRect(element, this.window);
      const dims = getElementDimensions(element);
      // dims has dimensions calculated from window
      outerBox.top = Math.min(outerBox.top, box.top - dims.marginTop);
      outerBox.right = Math.max(
        outerBox.right,
        box.left + box.width + dims.marginRight,
      );
      outerBox.bottom = Math.max(
        outerBox.bottom,
        box.top + box.height + dims.marginBottom,
      );
      outerBox.left = Math.min(outerBox.left, box.left - dims.marginLeft);

      const rectNode = this.measureNode(element);

      if (rectNode !== null) {
        this.fillCanvas(context, rectNode, dims);
      }

      if (!name) {
        name = elements[0].nodeName.toLowerCase();

        const node = elements[0];
        const hook: DevToolsHook =
          node.ownerDocument.defaultView.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook != null && hook.rendererInterfaces != null) {
          let ownerName = null;
          // eslint-disable-next-line no-for-of-loops/no-for-of-loops
          for (const rendererInterface of hook.rendererInterfaces.values()) {
            const id = rendererInterface.getFiberIDForNative(node, true);
            if (id !== null) {
              ownerName = rendererInterface.getDisplayNameForFiberID(id, true);
              break;
            }
          }

          if (ownerName) {
            name += ' (in ' + ownerName + ')';
          }
        }
      }

      this.tip.updateText(
        name,
        outerBox.right - outerBox.left,
        outerBox.bottom - outerBox.top,
      );
      const tipBounds = getNestedBoundingClientRect(
        this.tipBoundsWindow.document.documentElement,
        this.window,
      );

      this.tip.updatePosition(
        {
          top: outerBox.top,
          left: outerBox.left,
          height: outerBox.bottom - outerBox.top,
          width: outerBox.right - outerBox.left,
        },
        {
          top: tipBounds.top + this.tipBoundsWindow.scrollY,
          left: tipBounds.left + this.tipBoundsWindow.scrollX,
          height: this.tipBoundsWindow.innerHeight,
          width: this.tipBoundsWindow.innerWidth,
        },
      );
    });
  }

  measureNode(node: Object): Rect | null {
    if (!node || typeof node.getBoundingClientRect !== 'function') {
      return null;
    }

    const currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;

    return getNestedBoundingClientRect(node, currentWindow);
  }

  fillCanvas(context: CanvasRenderingContext2D, rect: Rect, dims: any): void {
    const {height, left, top, width} = rect;

    //fill margin
    const fillLeftMargin = left - dims.marginLeft;
    const fillTopMargin = top - dims.marginTop;
    const fillWidthMargin = width + dims.marginLeft + dims.marginRight;
    const fillHeightMargin = height + dims.marginTop + dims.marginBottom;

    context.fillStyle = highlightStyles.margin;
    context.fillRect(
      fillLeftMargin,
      fillTopMargin,
      fillWidthMargin,
      fillHeightMargin,
    );

    //fill padding
    context.fillStyle = highlightStyles.padding;
    context.clearRect(left, top, width, height);
    context.fillRect(left, top, width, height);

    //fill content
    const fillLeft = left + dims.borderLeft + dims.paddingLeft;
    const fillTop = top + dims.borderTop + dims.paddingTop;
    const fillWidth =
      width -
      dims.borderLeft -
      dims.borderRight -
      dims.paddingLeft -
      dims.paddingRight;
    const fillHeight =
      height -
      dims.borderTop -
      dims.borderBottom -
      dims.paddingTop -
      dims.paddingBottom;

    context.fillStyle = highlightStyles.background;

    context.clearRect(fillLeft, fillTop, fillWidth, fillHeight);
    context.fillRect(fillLeft, fillTop, fillWidth, fillHeight);
  }

  remove() {
    this.tip.remove();
    this.destroy();
  }

  //trace updates functions

  draw(nodeToData: Map<NativeType, Data>): void {
    if (this.canvas === null) {
      this.initialize();
    }
    // const canvasFlow: HTMLCanvasElement = ((traceUpdatesCanvas: any): HTMLCanvasElement);
    const canvasFlow: HTMLCanvasElement = ((this.canvas: any): HTMLCanvasElement);
    canvasFlow.width = window.innerWidth;
    canvasFlow.height = window.innerHeight;

    const context = canvasFlow.getContext('2d');
    context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);

    nodeToData.forEach(({count, rect}) => {
      if (rect !== null) {
        const colorIndex = Math.min(COLORS.length - 1, count - 1);
        const color = COLORS[colorIndex];

        this.drawBorder(context, rect, color);
      }
    });
  }

  drawBorder(
    context: CanvasRenderingContext2D,
    rect: Rect,
    color: string,
  ): void {
    const {height, left, top, width} = rect;

    // outline
    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;

    context.strokeRect(left - 1, top - 1, width + 2, height + 2);

    // inset
    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left + 1, top + 1, width - 1, height - 1);
    context.strokeStyle = color;

    context.setLineDash([0]);

    // border
    context.lineWidth = 1;
    context.strokeRect(left, top, width - 1, height - 1);

    context.setLineDash([0]);
  }

  destroy(): void {
    if (this.canvas !== null) {
      if (this.canvas.parentNode != null) {
        this.canvas.parentNode.removeChild(this.canvas);
      }
      this.canvas = null;
    }
  }
}

function findTipPos(dims, bounds, tipSize) {
  const tipHeight = Math.max(tipSize.height, 20);
  const tipWidth = Math.max(tipSize.width, 60);
  const margin = 5;

  let top;
  if (dims.top + dims.height + tipHeight <= bounds.top + bounds.height) {
    if (dims.top + dims.height < bounds.top + 0) {
      top = bounds.top + margin;
    } else {
      top = dims.top + dims.height + margin;
    }
  } else if (dims.top - tipHeight <= bounds.top + bounds.height) {
    if (dims.top - tipHeight - margin < bounds.top + margin) {
      top = bounds.top + margin;
    } else {
      top = dims.top - tipHeight - margin;
    }
  } else {
    top = bounds.top + bounds.height - tipHeight - margin;
  }

  let left = dims.left + margin;
  if (dims.left < bounds.left) {
    left = bounds.left + margin;
  }
  if (dims.left + tipWidth > bounds.left + bounds.width) {
    left = bounds.left + bounds.width - tipWidth - margin;
  }

  top += 'px';
  left += 'px';
  return {
    style: {top, left},
  };
}
