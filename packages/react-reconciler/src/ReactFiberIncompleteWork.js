/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostContext} from './ReactFiberHostContext';
import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {CapturedValue} from './ReactCapturedValue';
import type {UpdateQueue} from './ReactFiberUpdateQueue';
import type {ExpirationTime} from './ReactFiberExpirationTime';

import {createWorkInProgress} from './ReactFiber';
import {createCapturedValue} from './ReactCapturedValue';
import {
  ensureUpdateQueues,
  insertUpdateIntoFiber,
} from './ReactFiberUpdateQueue';

import {
  IndeterminateComponent,
  FunctionalComponent,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  CallComponent,
  CallHandlerPhase,
  ReturnComponent,
  ContextProvider,
  ContextConsumer,
  Fragment,
  Mode,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  DidCapture,
  Incomplete,
  Combined,
  Err,
  AlgebraicEffectMask,
} from 'shared/ReactTypeOfSideEffect';

import {
  popContextProvider as popLegacyContextProvider,
  popTopLevelContextObject as popTopLevelLegacyContextObject,
} from './ReactFiberContext';
import {popProvider} from './ReactFiberNewContext';

import invariant from 'fbjs/lib/invariant';

function captureEffect(effectList, previousEffect, effect) {
  // Remove an effect from the effect list
  if (previousEffect === null) {
    effectList.firstEffect = effect.nextEffect;
  } else {
    previousEffect.nextEffect = effect.nextEffect;
  }
  if (effect.nextEffect === null) {
    effectList.lastEffect = previousEffect;
  }
}

function addEffectToReturnFiber(returnFiber, effectFiber) {
  if ((returnFiber.effectTag & Incomplete) === NoEffect) {
    // Some children already completed. Reset the effect list.
    returnFiber.firstEffect = returnFiber.lastEffect = effectFiber;
  } else {
    // We already have some thrown effects. Append the new effect to the
    // end of the list.
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = effectFiber;
    } else {
      returnFiber.firstEffect = effectFiber;
    }
    returnFiber.lastEffect = effectFiber;
  }
  returnFiber.effectTag |= Incomplete;
}

export function raiseUnknownEffect(
  returnFiber: Fiber,
  sourceFiber: Fiber,
  value: mixed,
) {
  let algebraicEffectTag;
  if (value instanceof Error) {
    algebraicEffectTag = Err;
  } else if (value !== null && typeof value === 'object') {
    // If instanceof fails, fall back to duck typing.
    if (typeof value.stack === 'string' && typeof value.message === 'string') {
      algebraicEffectTag = Err;
    } else {
      algebraicEffectTag = NoEffect;
    }
  } else {
    algebraicEffectTag = NoEffect;
  }

  if (algebraicEffectTag === Err || algebraicEffectTag === NoEffect) {
    value = createCapturedValue(value, algebraicEffectTag, sourceFiber);
  }
  raiseEffect(returnFiber, sourceFiber, value, algebraicEffectTag);
}

export function raiseCombinedEffect(
  returnFiber: Fiber,
  sourceFiber: Fiber,
  values: mixed,
) {
  raiseEffect(returnFiber, sourceFiber, values, Combined);
}

function raiseEffect(returnFiber, sourceFiber, value, algebraicEffectTag) {
  // The source fiber's effect list is no longer valid. The effect list
  // is likely already empty, since we reset this in the complete phase,
  // but errors could be thrown in the complete phase, too.
  sourceFiber.firstEffect = sourceFiber.lastEffect = null;
  sourceFiber.effectTag |= Incomplete | algebraicEffectTag;
  sourceFiber.thrownValue = value;
  addEffectToReturnFiber(returnFiber, sourceFiber);
}

export default function<C, CX>(
  hostContext: HostContext<C, CX>,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  markUncaughtError: (root: FiberRoot, error: CapturedValue<mixed>) => void,
) {
  const {popHostContainer, popHostContext} = hostContext;

  function handleRootUnknown(
    current,
    workInProgress,
    sourceFiber,
    unknownValue,
    renderExpirationTime,
  ) {
    // Turn this into an error info object
    unknownValue.tag = Err;
    return handleRootError(
      current,
      workInProgress,
      unknownValue,
      renderExpirationTime,
    );
  }

  function handleRootError(
    current,
    workInProgress,
    errorInfo,
    renderExpirationTime,
  ) {
    markUncaughtError(workInProgress, errorInfo);
    // Unmount the entire tree.
    workInProgress.updateQueue = current.updateQueue = null;
    const update = {
      expirationTime: renderExpirationTime,
      partialState: {element: null},
      callback: null,
      isReplace: false,
      isForced: false,
      capturedValue: null,
      next: null,
    };
    insertUpdateIntoFiber(workInProgress, update);
    return true;
  }

  function handleRootEffect(
    current,
    workInProgress,
    effectSource,
    algebraicEffectTag,
    effectValue,
    renderIsExpired,
    renderExpirationTime,
  ) {
    switch (algebraicEffectTag) {
      case Combined: {
        const nestedValues: Array<CapturedValue<mixed>> = (effectValue: any);
        let shouldRetry = false;
        for (let i = 0; i < nestedValues.length; i++) {
          const nestedValue = nestedValues[i];
          if (
            handleRootEffect(
              current,
              workInProgress,
              nestedValue.source,
              nestedValue.tag,
              nestedValue,
              renderIsExpired,
              renderExpirationTime,
            )
          ) {
            shouldRetry = true;
          }
        }
        return shouldRetry;
      }
      case NoEffect:
        // Anything other than a promise is treated as an error.
        return handleRootUnknown(
          current,
          workInProgress,
          effectSource,
          effectValue,
          renderExpirationTime,
        );
      case Err:
        return handleRootError(
          current,
          workInProgress,
          effectValue,
          renderExpirationTime,
        );
      default:
        invariant(
          false,
          'Cannot have more than one algebraic effect tag. They should be ' +
            'mutally exclusive. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
  }

  function exitIncompleteRoot(
    workInProgress,
    renderIsExpired,
    renderExpirationTime,
  ) {
    const root: FiberRoot = workInProgress.stateNode;
    const current = root.current;

    let shouldRetry;
    let effect = workInProgress.firstEffect;
    while (effect !== null) {
      const effectValue = effect.thrownValue;
      const effectSource = effect;
      const algebraicEffectTag = effect.effectTag & AlgebraicEffectMask;
      shouldRetry = handleRootEffect(
        current,
        workInProgress,
        effectSource,
        algebraicEffectTag,
        effectValue,
        renderIsExpired,
        renderExpirationTime,
      );
      effect = effect.nextEffect;
    }

    if (shouldRetry) {
      return createWorkInProgress(current, null, workInProgress.expirationTime);
    }
    return null;
  }

  function handleClassEffect(
    workInProgress,
    errors,
    algebraicEffectTag,
    effectValue,
  ) {
    switch (algebraicEffectTag) {
      case Err: {
        const errorInfo = effectValue;
        errors.push(errorInfo);
        return true;
      }
      default:
        return false;
    }
  }

  function exitIncompleteWork(
    current: Fiber | null,
    workInProgress: Fiber,
    renderIsExpired: boolean,
    renderExpirationTime: ExpirationTime,
  ) {
    let next = null;
    switch (workInProgress.tag) {
      case FunctionalComponent:
        break;
      case ClassComponent: {
        popLegacyContextProvider(workInProgress);
        const instance = workInProgress.stateNode;
        if (
          (workInProgress.effectTag & DidCapture) === NoEffect &&
          instance !== null &&
          typeof instance.componentDidCatch === 'function'
        ) {
          const errors = [];
          let previousEffect = null;
          let effect = workInProgress.firstEffect;
          while (effect !== null) {
            const algebraicEffectTag = effect.effectTag & AlgebraicEffectMask;
            const effectValue = effect.thrownValue;
            const didHandle = handleClassEffect(
              workInProgress,
              errors,
              algebraicEffectTag,
              effectValue,
            );
            if (didHandle) {
              captureEffect(workInProgress, previousEffect, effect);
            }
            previousEffect = effect;
            effect = effect.nextEffect;
          }
          if (errors.length > 0) {
            ensureUpdateQueues(workInProgress);
            const updateQueue: UpdateQueue<
              any,
            > = (workInProgress.updateQueue: any);
            updateQueue.capturedValues = errors;
            workInProgress.effectTag |= DidCapture;
            // Render the boundary again
            next = workInProgress;
          }
        }
        break;
      }
      case HostRoot:
        popHostContainer(workInProgress);
        popTopLevelLegacyContextObject(workInProgress);
        next = exitIncompleteRoot(
          workInProgress,
          renderIsExpired,
          renderExpirationTime,
        );
        break;
      case HostComponent:
        popHostContext(workInProgress);
        break;
      case HostText:
        break;
      case CallComponent:
        break;
      case CallHandlerPhase:
        break;
      case ReturnComponent:
        break;
      case Fragment:
        break;
      case Mode:
        break;
      case HostPortal:
        popHostContainer(workInProgress);
        break;
      case ContextProvider:
        popProvider(workInProgress);
        break;
      case ContextConsumer:
        break;
      case IndeterminateComponent:
        break;
      default:
        invariant(
          false,
          'Unknown unit of work tag. This error is likely caused by a bug in ' +
            'React. Please file an issue.',
        );
    }
    return next;
  }
  return {
    exitIncompleteWork,
  };
}
