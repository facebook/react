/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import Agent from 'react-devtools-shared/src/backend/agent';
import {destroy as destroyCanvas, draw} from './canvas';
import {getNestedBoundingClientRect} from '../utils';

import type {FindNativeNodesForFiberID} from '../../types';
import type {Rect} from '../utils';

// How long the rect should be shown for?
const DISPLAY_DURATION = 250;

// How long should a rect be considered valid for?
const REMEASUREMENT_AFTER_DURATION = 250;

// Some environments (e.g. React Native / Hermes) don't support the performace API yet.
const getCurrentTime =
  typeof performance === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

export type Data = {|
  count: number,
  expirationTime: number,
  lastMeasuredAt: number,
  rects: Array<Rect>,
|};

const idToData: Map<number, Data> = new Map();

let agent: Agent = ((null: any): Agent);
let drawAnimationFrameID: AnimationFrameID | null = null;
let isEnabled: boolean = false;
let redrawTimeoutID: TimeoutID | null = null;

export function initialize(injectedAgent: Agent): void {
  agent = injectedAgent;
  agent.addListener('traceUpdates', traceUpdates);
}

export function toggleEnabled(value: boolean): void {
  console.log('[TraceUpdates] toggleEnabled()', value);
  isEnabled = value;

  if (!isEnabled) {
    idToData.clear();

    if (drawAnimationFrameID !== null) {
      cancelAnimationFrame(drawAnimationFrameID);
      drawAnimationFrameID = null;
    }

    if (redrawTimeoutID !== null) {
      clearTimeout(redrawTimeoutID);
      redrawTimeoutID = null;
    }

    destroyCanvas();
  }
}

function traceUpdates(
  highlightedNodesMap: Map<number, FindNativeNodesForFiberID>,
): void {
  if (!isEnabled) {
    return;
  }

  highlightedNodesMap.forEach((findNativeNodes, id) => {
    const data = idToData.get(id);
    const now = getCurrentTime();

    let lastMeasuredAt = data != null ? data.lastMeasuredAt : 0;
    let rects = data != null ? data.rects : [];
    if (lastMeasuredAt + REMEASUREMENT_AFTER_DURATION < now) {
      lastMeasuredAt = now;

      const nodes = findNativeNodes(id);
      if (nodes != null) {
        rects = ((nodes
          .map(measureNode)
          .filter(rect => rect !== null): any): Array<Rect>);
      }
    }

    idToData.set(id, {
      count: data != null ? data.count + 1 : 1,
      expirationTime:
        data != null
          ? Math.min(Number.MAX_VALUE, data.expirationTime + DISPLAY_DURATION)
          : now + DISPLAY_DURATION,
      lastMeasuredAt,
      rects,
    });
  });

  if (redrawTimeoutID !== null) {
    clearTimeout(redrawTimeoutID);
    redrawTimeoutID = null;
  }

  if (drawAnimationFrameID === null) {
    drawAnimationFrameID = requestAnimationFrame(prepareToDraw);
  }
}

function prepareToDraw(): void {
  drawAnimationFrameID = null;
  redrawTimeoutID = null;

  const now = getCurrentTime();
  let earliestExpiration = Number.MAX_VALUE;

  // Remove any items that have already expired.
  idToData.forEach((data, id) => {
    if (data.expirationTime < now) {
      idToData.delete(id);
    } else {
      earliestExpiration = Math.min(earliestExpiration, data.expirationTime);
    }
  });

  draw(idToData);

  redrawTimeoutID = setTimeout(prepareToDraw, earliestExpiration - now);
}

function measureNode(node: Object): Rect | null {
  if (!node || typeof node.getBoundingClientRect !== 'function') {
    return null;
  }

  let currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;

  return getNestedBoundingClientRect(node, currentWindow);
}
