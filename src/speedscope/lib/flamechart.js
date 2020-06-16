// @flow

import type { Frame, CallTreeNode } from './profile'

import { lastOf } from './utils';
import { clamp } from './math';

export interface FlamechartFrame {
  node: CallTreeNode;
  start: number;
  end: number;
  parent: FlamechartFrame | null;
  children: FlamechartFrame[];
}

type StackLayer = FlamechartFrame[];

interface FlamechartDataSource {
  getTotalWeight(): number;

  formatValue(v: number): string;

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void
  ): void;

  getColorBucketForFrame(f: Frame): number;
}

export class Flamechart {
  source: FlamechartDataSource;

  // Bottom to top
  layers: StackLayer[];
  totalWeight: number;
  minFrameWidth: number;

  constructor(source: FlamechartDataSource) {
    this.source = source;

    // Bottom to top
    this.layers = [];
    this.totalWeight = 0;
    this.minFrameWidth = 1;

    const stack: FlamechartFrame[] = [];
    const openFrame = (node, value) => {
      const parent = lastOf(stack);
      const frame = {
        node,
        parent,
        children: [],
        start: value,
        end: value,
      };
      if (parent) {
        parent.children.push(frame);
      }
      stack.push(frame);
    };
    this.minFrameWidth = Infinity;
    const closeFrame = (node, value) => {
      console.assert(stack.length > 0);
      const stackTop = stack.pop();
      stackTop.end = value;
      if (stackTop.end - stackTop.start === 0) return;
      const layerIndex = stack.length;
      while (this.layers.length <= layerIndex) this.layers.push([]);
      this.layers[layerIndex].push(stackTop);
      this.minFrameWidth = Math.min(
        this.minFrameWidth,
        stackTop.end - stackTop.start
      );
    };
    this.totalWeight = source.getTotalWeight();
    source.forEachCall(openFrame, closeFrame);
    if (!isFinite(this.minFrameWidth)) this.minFrameWidth = 1;
  }
  getTotalWeight() {
    return this.totalWeight;
  }
  getLayers(): StackLayer[] {
    return this.layers;
  }
  getColorBucketForFrame(frame: Frame) {
    return this.source.getColorBucketForFrame(frame);
  }
  getMinFrameWidth() {
    return this.minFrameWidth;
  }
  formatValue(v) {
    return this.source.formatValue(v);
  }
  getClampedViewportWidth(viewportWidth: number) {
    const maxWidth = this.getTotalWeight();
    // In order to avoid floating point error, we cap the maximum zoom. In
    // particular, it's important that at the maximum zoom level, the total
    // trace size + a viewport width is not equal to the trace size due to
    // floating point rounding.
    //
    // For instance, if the profile's total weight is 2^60, and the viewport
    // size is 1, trying to move one viewport width right will result in no
    // change because 2^60 + 1 = 2^60 in floating point arithmetic. JavaScript
    // numbers are 64 bit floats, and therefore have 53 mantissa bits. You can
    // see this for yourself in the console. Try:
    //
    //   > Math.pow(2, 60) + 1 === Math.pow(2, 60)
    //   true
    //   > Math.pow(2, 53) + 1 === Math.pow(2, 53)
    //   true
    //   > Math.pow(2, 52) + 1 === Math.pow(2, 52)
    //   false
    //
    // We use 2^40 as a cap instead, since we want to be able to make small
    // adjustments within a viewport width.
    //
    // For reference, this will still allow you to zoom until 1 nanosecond fills
    // the screen in a profile with a duration of over 18 minutes.
    //
    //   > Math.pow(2, 40) / (60 * Math.pow(10, 9))
    //   18.325193796266667
    //
    const maxZoom = Math.pow(2, 40);
    // In addition to capping zoom to avoid floating point error, we further cap
    // zoom to avoid letting you zoom in so that the smallest element more than
    // fills the screen, since that probably isn't useful. The final zoom cap is
    // determined by the minimum zoom of either 2^40x zoom or the necessary zoom
    // for the smallest frame to fill the screen three times.
    const minWidth = clamp(
      3 * this.getMinFrameWidth(),
      maxWidth / maxZoom,
      maxWidth
    );
    return clamp(viewportWidth, minWidth, maxWidth);
  }
}
