/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Data} from './index';
import type {Rect} from '../utils';
import type {HostInstance} from '../../types';
import type Agent from '../../agent';

import {isReactNativeEnvironment} from 'react-devtools-shared/src/backend/utils';

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

function drawNative(nodeToData: Map<HostInstance, Data>, agent: Agent) {
  const nodesToDraw = [];
  iterateNodes(nodeToData, ({color, node}) => {
    nodesToDraw.push({node, color});
  });

  agent.emit('drawTraceUpdates', nodesToDraw);
}

function drawWeb(nodeToData: Map<HostInstance, Data>) {
  if (canvas === null) {
    initialize();
  }

  const canvasFlow: HTMLCanvasElement = ((canvas: any): HTMLCanvasElement);
  const dpr = window.devicePixelRatio || 1;

  canvasFlow.width = window.innerWidth * dpr;
  canvasFlow.height = window.innerHeight * dpr;

  canvasFlow.style.width = `${window.innerWidth}px`;
  canvasFlow.style.height = `${window.innerHeight}px`;

  const context = canvasFlow.getContext('2d');
  context.scale(dpr, dpr);

  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  type GroupItem = {
    rect: Rect,
    color: string,
    displayName: string | null,
    count: number,
  };

  const positionGroups: Map<string, Array<GroupItem>> = new Map();

  iterateNodes(nodeToData, ({rect, color, displayName, count, node}) => {
    if (rect !== null) {
      const key = `${rect.left},${rect.top}`;
      const group = positionGroups.get(key) || [];
      if (!positionGroups.has(key)) {
        positionGroups.set(key, group);
      }
      group.push({rect, color, displayName, count});
    }
  });

  positionGroups.forEach(group => {
    const {rect} = group[0];

    group.forEach(({color}) => {
      drawBorder(context, rect, color);
    });

    const mergedName = group
      .map(({displayName, count}) => {
      if (displayName !== null) {
        return `${displayName}${count > 1 ? ` x${count}` : ''}`;
      }
      })
      .filter(Boolean)
      .join(', ');

    if (mergedName) {
      drawLabel(context, rect, mergedName, group[0].color);
    }
  });
}

export function draw(nodeToData: Map<HostInstance, Data>, agent: Agent): void {
  return isReactNativeEnvironment()
    ? drawNative(nodeToData, agent)
    : drawWeb(nodeToData);
}

type DataWithColorAndNode = {
  ...Data,
  color: string,
  node: HostInstance,
};

function iterateNodes(
  nodeToData: Map<HostInstance, Data>,
  execute: (data: DataWithColorAndNode) => void,
) {
  nodeToData.forEach((data, node) => {
    const colorIndex = Math.min(COLORS.length - 1, data.count - 1);
    const color = COLORS[colorIndex];
    execute({...data, color, node});
  });
}

function drawBorder(
  context: CanvasRenderingContext2D,
  rect: Rect,
  color: string,
): void {
  const {height, left, top, width} = rect;

  // border
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.strokeRect(left, top, width - 1, height - 1);
}

function drawLabel(
  context: CanvasRenderingContext2D,
  rect: Rect,
  text: string,
  color: string,
): void {
  const {left, top} = rect;

  context.font = '10px monospace';
  context.textBaseline = 'middle';
  context.textAlign = 'center';

  const metrics = context.measureText(text);
  const padding = 2;
  const textHeight = 14;
  const backgroundWidth = metrics.width + padding * 2;
  const backgroundHeight = textHeight;

  const labelX = left;
  const labelY = top - backgroundHeight;

  context.fillStyle = color;
  context.fillRect(labelX, labelY, backgroundWidth, backgroundHeight);

  context.fillStyle = '#000000';
  context.fillText(
    text,
    labelX + backgroundWidth / 2,
    labelY + backgroundHeight / 2,
  );
}

function destroyNative(agent: Agent) {
  agent.emit('disableTraceUpdates');
}

function destroyWeb() {
  if (canvas !== null) {
    if (canvas.parentNode != null) {
      canvas.parentNode.removeChild(canvas);
    }
    canvas = null;
  }
}

export function destroy(agent: Agent): void {
  return isReactNativeEnvironment() ? destroyNative(agent) : destroyWeb();
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
