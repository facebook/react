/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Canvas from './Canvas';
import type {NativeType} from '../../types';
import type {Data} from './index';
import type {Rect} from '../utils';
import {getElementDimensions, getNestedBoundingClientRect} from '../utils';

const SHOW_DURATION = 2000;

let timeoutID: TimeoutID | null = null;
let highlightCanvas: Canvas | null = null;

export function hideOverlay() {
  timeoutID = null;

  if (highlightCanvas !== null) {
    highlightCanvas.remove();
    highlightCanvas = null;
  }
}

export function showOverlay(
  elements: Array<HTMLElement> | null,
  componentName: string | null,
  hideAfterTimeout: boolean,
) {
  // TODO (npm-packages) Detect RN and support it somehow
  if (window.document == null) {
    return;
  }

  if (timeoutID !== null) {
    clearTimeout(timeoutID);
  }

  if (elements == null) {
    return;
  }

  if (highlightCanvas === null) {
    highlightCanvas = new Canvas();
  }

  const nodeToData: Map<NativeType, Data> = new Map();
  const nodes = elements.filter(
    element => element.nodeType === Node.ELEMENT_NODE,
  );
  nodes.forEach(node => {
    const rect = measureNode(node);
    const box = getNestedBoundingClientRect(node, window);
    const dims = getElementDimensions(node);
    nodeToData.set(node, {
      expirationTime: 0,
      lastMeasuredAt: 0,
      count: 1,
      rect,
      box,
      dims,
      type: 'DOMHighlighter',
      nodeName: nodes[0],
    });
  });

  highlightCanvas.draw(nodeToData, componentName);

  if (hideAfterTimeout) {
    timeoutID = setTimeout(hideOverlay, SHOW_DURATION);
  }
}

function measureNode(node: Object): Rect | null {
  if (!node || typeof node.getBoundingClientRect !== 'function') {
    return null;
  }

  const currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;

  return getNestedBoundingClientRect(node, currentWindow);
}
