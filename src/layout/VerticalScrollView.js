// @flow

import type {
  Interaction,
  VerticalPanStartInteraction,
  VerticalPanMoveInteraction,
  VerticalPanEndInteraction,
  WheelPlainInteraction,
} from '../useCanvasInteraction';
import type {Rect} from './geometry';

import {Surface} from './Surface';
import {View} from './View';
import {rectContainsPoint} from './geometry';
import {MOVE_WHEEL_DELTA_THRESHOLD} from '../canvas/constants'; // TODO: Remove external dependency

type VerticalScrollState = {|
  offsetY: number,
|};

function scrollStatesAreEqual(
  state1: VerticalScrollState,
  state2: VerticalScrollState,
): boolean {
  return state1.offsetY === state2.offsetY;
}

// TODO: Deduplicate
function clamp(min: number, max: number, value: number): number {
  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    throw new Error(
      `Clamp was called with NaN. Args: min: ${min}, max: ${max}, value: ${value}.`,
    );
  }
  return Math.min(max, Math.max(min, value));
}

export class VerticalScrollView extends View {
  contentView: View;

  scrollState: VerticalScrollState = {
    offsetY: 0,
  };

  stateDeriver: (state: VerticalScrollState) => VerticalScrollState = state =>
    state;

  onStateChange: (state: VerticalScrollState) => void = () => {};

  constructor(
    surface: Surface,
    frame: Rect,
    contentView: View,
    stateDeriver?: (state: VerticalScrollState) => VerticalScrollState,
    onStateChange?: (state: VerticalScrollState) => void,
  ) {
    super(surface, frame);
    this.contentView = contentView;
    contentView.superview = this;
    if (stateDeriver) this.stateDeriver = stateDeriver;
    if (onStateChange) this.onStateChange = onStateChange;
  }

  setNeedsDisplay() {
    super.setNeedsDisplay();
    this.contentView.setNeedsDisplay();
  }

  setFrame(newFrame: Rect) {
    super.setFrame(newFrame);

    // Revalidate scrollState
    this.updateState(this.scrollState);
  }

  layoutSubviews() {
    const {offsetY} = this.scrollState;
    const desiredSize = this.contentView.desiredSize();

    const remainingHeight = this.frame.size.height;
    const desiredHeight = desiredSize ? desiredSize.height : 0;
    // Force last view to take up at least all remaining vertical space.
    const height = Math.max(desiredHeight, remainingHeight);

    const proposedFrame = {
      origin: {
        x: this.frame.origin.x,
        y: this.frame.origin.y + offsetY,
      },
      size: {
        width: this.frame.size.width,
        height,
      },
    };
    this.contentView.setFrame(proposedFrame);
    this.contentView.setVisibleArea(this.visibleArea);
  }

  draw(context: CanvasRenderingContext2D) {
    this.contentView.displayIfNeeded(context);
  }

  isPanning = false;

  handleVerticalPanStart(interaction: VerticalPanStartInteraction) {
    if (rectContainsPoint(interaction.payload.location, this.frame)) {
      this.isPanning = true;
    }
  }

  handleVerticalPanMove(interaction: VerticalPanMoveInteraction) {
    if (!this.isPanning) {
      return;
    }
    const {offsetY} = this.scrollState;
    const {movementY} = interaction.payload.event;
    this.updateState({
      ...this.scrollState,
      offsetY: offsetY + movementY,
    });
  }

  handleVerticalPanEnd(interaction: VerticalPanEndInteraction) {
    if (this.isPanning) {
      this.isPanning = false;
    }
  }

  handleWheelPlain(interaction: WheelPlainInteraction) {
    const {
      location,
      event: {deltaX, deltaY},
    } = interaction.payload;
    if (!rectContainsPoint(location, this.frame)) {
      return; // Not scrolling on view
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    if (absDeltaX > absDeltaY) {
      return; // Scrolling horizontally
    }

    if (absDeltaY < MOVE_WHEEL_DELTA_THRESHOLD) {
      return;
    }

    this.updateState({
      ...this.scrollState,
      offsetY: this.scrollState.offsetY - deltaY,
    });
  }

  handleInteractionAndPropagateToSubviews(interaction: Interaction) {
    switch (interaction.type) {
      case 'vertical-pan-start':
        this.handleVerticalPanStart(interaction);
        break;
      case 'vertical-pan-move':
        this.handleVerticalPanMove(interaction);
        break;
      case 'vertical-pan-end':
        this.handleVerticalPanEnd(interaction);
        break;
      case 'wheel-plain':
        this.handleWheelPlain(interaction);
        break;
    }
    this.contentView.handleInteractionAndPropagateToSubviews(interaction);
  }

  /**
   * @private
   */
  updateState(proposedState: VerticalScrollState) {
    const clampedState = this.stateDeriver(
      this.clampedProposedState(proposedState),
    );
    if (!scrollStatesAreEqual(clampedState, this.scrollState)) {
      this.scrollState = clampedState;
      this.onStateChange(this.scrollState);
      this.setNeedsDisplay();
    }
  }

  /**
   * @private
   */
  clampedProposedState(
    proposedState: VerticalScrollState,
  ): VerticalScrollState {
    return {
      offsetY: clamp(
        -(this.contentView.frame.size.height - this.frame.size.height),
        0,
        proposedState.offsetY,
      ),
    };
  }
}
