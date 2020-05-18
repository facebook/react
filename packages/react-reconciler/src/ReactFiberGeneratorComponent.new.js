/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {Lanes} from './ReactFiberLane';

import {NoEffect, GeneratorIncomplete} from './ReactSideEffectTags';

export type RenderStateMachine = Generator<Fiber | null, void, void>;

const stack = [];

export function beginGeneratorComponent(
  generatorFn: (
    current: Fiber | null,
    workInProgress: Fiber,
    renderLanes: Lanes,
  ) => RenderStateMachine,
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const stateMachine = generatorFn(current, workInProgress, renderLanes);
  const state = stateMachine.next();
  if (state.done) {
    return null;
  }
  workInProgress.effectTag |= GeneratorIncomplete;
  stack.push(stateMachine);
  return state.value;
}

export function completeGeneratorComponent(
  current: Fiber | null,
  workInProgress: Fiber,
): Fiber | null {
  if ((workInProgress.effectTag & GeneratorIncomplete) === NoEffect) {
    return null;
  }
  const stateMachine = stack.pop();
  const state = stateMachine.next();
  if (state.done) {
    workInProgress.effectTag &= ~GeneratorIncomplete;
    return null;
  }
  stack.push(stateMachine);
  return state.value;
}

export function unwindGeneratorComponent(workInProgress: Fiber): Fiber | null {
  if ((workInProgress.effectTag & GeneratorIncomplete) === NoEffect) {
    return null;
  }
  const stateMachine = stack.pop();
  try {
    const state = stateMachine.throw(null);
    if (state.done) {
      workInProgress.effectTag &= ~GeneratorIncomplete;
      return null;
    }
    stack.push(stateMachine);
    return state.value;
  } catch (error) {
    workInProgress.effectTag &= ~GeneratorIncomplete;
    return null;
  }
}
