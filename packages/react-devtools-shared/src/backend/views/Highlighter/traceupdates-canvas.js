/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Data} from './index';
import type {Rect} from '../utils';
import type {NativeType} from '../../types';

const OUTLINE_COLOR = '#f0f0f0';

// Note these colors are in sync with DevTools Profiler chart colors.
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

let canvas: HTMLCanvasElement | null = null;

export function draw(nodeToData: Map<NativeType, Data>): void {
  if (canvas === null) {
    initialize();
  }

  const canvasFlow: HTMLCanvasElement = ((canvas: any): HTMLCanvasElement);
  canvasFlow.width = window.innerWidth;
  canvasFlow.height = window.innerHeight;

  const context = canvasFlow.getContext('2d');
  context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);

  nodeToData.forEach(({count, rect}) => {
    if (rect !== null) {
      const colorIndex = Math.min(COLORS.length - 1, count - 1);
      const color = COLORS[colorIndex];

      drawBorder(context, rect, color);
    }
  });
}

function drawBorder(
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

export function destroy(): void {
  if (canvas !== null) {
    if (canvas.parentNode != null) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
  }
}

function initialize(): void {
  canvas = window.document.createElement('canvas');
  canvas.style.cssText = `
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
  root.insertBefore(canvas, root.firstChild);
}
