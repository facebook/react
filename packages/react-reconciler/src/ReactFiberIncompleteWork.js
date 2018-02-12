import {createWorkInProgress} from './ReactFiber';
import {createCapturedValue} from './ReactCapturedValue';
import {suspendPendingWork} from './ReactFiberPendingWork';
import {
  processUpdateQueue,
  insertRenderPhaseUpdateIntoFiber,
  ensureUpdateQueues,
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
  AsyncBoundary,
  TimeoutComponent,
} from 'shared/ReactTypeOfWork';
import {
  NoEffect,
  DidCapture,
  Incomplete,
  Combined,
  Err,
  Suspend,
  Loading,
  Timeout,
  AlgebraicEffectMask,
} from 'shared/ReactTypeOfSideEffect';
import {Sync} from './ReactFiberExpirationTime';

import {enableGetDerivedStateFromCatch} from 'shared/ReactFeatureFlags';

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

export function raiseUnknownEffect(returnFiber, sourceFiber, value) {
  let algebraicEffectTag;
  if (value instanceof Promise) {
    algebraicEffectTag = Suspend;
  } else if (value instanceof Error) {
    algebraicEffectTag = Err;
  } else if (value !== null && typeof value === 'object') {
    // If instanceof fails, fall back to duck typing.
    if (typeof value.then === 'function') {
      algebraicEffectTag = Suspend;
    } else if (
      typeof value.stack === 'string' &&
      typeof value.message === 'string'
    ) {
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

export function raiseCombinedEffect(returnFiber, sourceFiber, values) {
  raiseEffect(returnFiber, sourceFiber, values, Combined);
}

function raiseLoadingEffect(returnFiber, sourceFiber, promises) {
  raiseEffect(returnFiber, sourceFiber, promises, Loading);
}

function raiseTimeoutEffect(returnFiber, sourceFiber, timeout) {
  raiseEffect(returnFiber, sourceFiber, timeout, Timeout);
}

function raiseEffect(returnFiber, sourceFiber, value, algebraicEffectTag) {
  if ((sourceFiber.effectTag & Incomplete) === NoEffect) {
    // The source fiber's effect list is no longer valid. The effect list
    // is likely already empty, since we reset this in the complete phase,
    // but errors could be thrown in the complete phase, too.
    sourceFiber.firstEffect = sourceFiber.lastEffect = null;
  }
  sourceFiber.effectTag |= Incomplete | algebraicEffectTag;
  sourceFiber.thrownValue = value;
  addEffectToReturnFiber(returnFiber, sourceFiber);
}

function createRootExpirationError(sourceFiber, renderExpirationTime) {
  try {
    // TODO: Better error messages.
    invariant(
      renderExpirationTime !== Sync,
      'A synchronous update was suspended, but no fallback UI was provided.',
    );
    invariant(
      false,
      'An update was suspended for longer than the timeout, but no fallback ' +
        'UI was provided.',
    );
  } catch (error) {
    return createCapturedValue(error, Err, sourceFiber);
  }
}

export default function(
  hostContext: HostContext<C, CX>,
  retryOnPromiseResolution: (
    root: FiberRoot,
    blockedTime: ExpirationTime,
  ) => void,
  scheduleWork: (
    fiber: Fiber,
    startTime: ExpirationTime,
    expirationTime: ExpirationTime,
  ) => void,
  markUncaughtError: (root: FiberRoot, error: CapturedValue<mixed>) => void,
  isAlreadyFailedLegacyErrorBoundary: (instance: mixed) => boolean,
) {
  const {popHostContainer, popHostContext} = hostContext;

  function handleRootLoading(
    current,
    workInProgress,
    promises,
    boundary,
    suspenders,
    renderIsExpired,
    renderStartTime,
    renderExpirationTime,
  ) {
    if (!renderIsExpired) {
      const slightlyHigherPriority = renderExpirationTime - 1;
      promises.push.apply(promises, suspenders);
      const loadingUpdate = {
        expirationTime: slightlyHigherPriority,
        partialState: true,
        callback: null,
        isReplace: true,
        isForced: false,
        capturedValue: null,
        next: null,
      };
      insertRenderPhaseUpdateIntoFiber(boundary, loadingUpdate);

      const revertUpdate = {
        expirationTime: renderExpirationTime,
        partialState: false,
        callback: null,
        isReplace: true,
        isForced: false,
        capturedValue: null,
        next: null,
      };
      insertRenderPhaseUpdateIntoFiber(boundary, revertUpdate);
      scheduleWork(boundary, renderStartTime, slightlyHigherPriority);
      return false;
    }
    const errorInfo = createRootExpirationError(boundary, renderExpirationTime);
    return handleRootError(
      current,
      workInProgress,
      errorInfo,
      renderExpirationTime,
    );
  }

  function handleRootSuspend(
    current,
    workInProgress,
    promises,
    sourceFiber,
    promise,
    renderIsExpired,
    renderExpirationTime,
  ) {
    if (!renderIsExpired) {
      promises.push(promise);
      return false;
    }
    const errorInfo = createRootExpirationError(
      sourceFiber,
      renderExpirationTime,
    );
    return handleRootError(
      current,
      workInProgress,
      errorInfo,
      renderExpirationTime,
    );
  }

  function handleRootTimeout(earliestTimeoutRef, timeout) {
    if (timeout < earliestTimeoutRef.value) {
      earliestTimeoutRef.value = timeout;
    }
    return false;
  }

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
    insertRenderPhaseUpdateIntoFiber(workInProgress, update);
    return true;
  }

  function handleRootEffect(
    current,
    workInProgress,
    promises,
    earliestTimeoutRef,
    effectSource,
    algebraicEffectTag,
    effectValue,
    renderIsExpired,
    renderStartTime,
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
              promises,
              earliestTimeoutRef,
              nestedValue.source,
              nestedValue.tag,
              nestedValue,
              renderIsExpired,
              renderStartTime,
              renderExpirationTime,
            )
          ) {
            shouldRetry = true;
          }
        }
        return shouldRetry;
      }
      // Intentionally fall through to error type
      case Loading: {
        return handleRootLoading(
          current,
          workInProgress,
          promises,
          effectSource,
          effectValue,
          renderIsExpired,
          renderStartTime,
          renderExpirationTime,
        );
      }
      case Suspend: {
        return handleRootSuspend(
          current,
          workInProgress,
          promises,
          effectSource,
          effectValue,
          renderIsExpired,
          renderExpirationTime,
        );
      }
      case Timeout: {
        return handleRootTimeout(earliestTimeoutRef, effectValue);
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
    remainingTimeMs,
    renderStartTime,
    renderExpirationTime,
  ) {
    const root: FiberRoot = workInProgress.stateNode;
    const current = root.current;

    const promises = [];
    const earliestTimeoutRef = {value: remainingTimeMs};
    let shouldRetry;
    let effect = workInProgress.firstEffect;
    while (effect !== null) {
      const effectValue = effect.thrownValue;
      const effectSource = effect;
      const algebraicEffectTag = effect.effectTag & AlgebraicEffectMask;
      shouldRetry = handleRootEffect(
        current,
        workInProgress,
        promises,
        earliestTimeoutRef,
        effectSource,
        algebraicEffectTag,
        effectValue,
        renderIsExpired,
        renderStartTime,
        renderExpirationTime,
      );
      effect = effect.nextEffect;
    }

    if (shouldRetry) {
      return createWorkInProgress(current, null, workInProgress.expirationTime);
    }

    const suspendedTime = renderExpirationTime;
    suspendPendingWork(root, suspendedTime);

    // Create a promise that resolves at the earliest timeout
    const timeoutMs = earliestTimeoutRef.value;
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, timeoutMs);
    });
    promises.push(timeoutPromise);

    // When the promise resolves, retry using the time at which the promise was
    // thrown, even if an earlier time was suspended in the intervening time.
    // TODO: What if a promise is rejected?
    Promise.race(promises).then(() => {
      retryOnPromiseResolution(root, suspendedTime);
    });

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
    workInProgress,
    elapsedMs,
    renderIsExpired,
    remainingTimeMs,
    renderStartTime,
    renderExpirationTime,
  ) {
    const current = workInProgress.alternate;

    let next = null;
    switch (workInProgress.tag) {
      case FunctionalComponent:
        break;
      case ClassComponent: {
        popLegacyContextProvider(workInProgress);
        const ctor = workInProgress.type;
        const instance = workInProgress.stateNode;
        if (
          (workInProgress.effectTag & DidCapture) === NoEffect &&
          ((typeof ctor.getDerivedStateFromCatch === 'function' &&
            enableGetDerivedStateFromCatch) ||
            (instance !== null &&
              typeof instance.componentDidCatch === 'function' &&
              !isAlreadyFailedLegacyErrorBoundary(instance)))
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
            const updateQueue: UpdateQueue = (workInProgress.updateQueue: any);
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
          remainingTimeMs,
          renderStartTime,
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
      case AsyncBoundary:
        const isLoading = workInProgress.memoizedState;
        if (current !== null && !isLoading && !renderIsExpired) {
          let promises = null;
          let previousEffect = null;
          let effect = workInProgress.firstEffect;
          while (effect !== null) {
            const thrownValue = effect.thrownValue;
            const algebraicEffectTag = effect.effectTag & AlgebraicEffectMask;
            switch (algebraicEffectTag) {
              case Suspend:
                captureEffect(workInProgress, previousEffect, effect);
                if (promises === null) {
                  promises = [thrownValue];
                } else {
                  promises.push(thrownValue);
                }
                break;
              default:
                break;
            }
            previousEffect = effect;
            effect = effect.nextEffect;
          }
          if (promises !== null) {
            const returnFiber = workInProgress.return;
            if (returnFiber !== null) {
              raiseLoadingEffect(returnFiber, workInProgress, promises);
            }
          }
        }
        break;
      case TimeoutComponent: {
        let nextState = workInProgress.memoizedState;
        const updateQueue = workInProgress.updateQueue;
        if (updateQueue !== null) {
          nextState = workInProgress.memoizedState = processUpdateQueue(
            current,
            workInProgress,
            updateQueue,
            null,
            null,
            renderExpirationTime,
          );
        }

        const didExpire = nextState !== null;
        const didCaptureAlready = workInProgress.effectTag & DidCapture;

        const timeout = workInProgress.pendingProps.ms;

        // Check if the boundary should capture promises that threw.
        let shouldCapture;
        if (didCaptureAlready) {
          // Already captured during this render. Can't capture again.
          shouldCapture = false;
        } else if (didExpire || renderIsExpired) {
          // Render is expired.
          shouldCapture = true;
        } else if (typeof timeout === 'number' && elapsedMs >= timeout) {
          // The elapsed time exceeds the provided timeout.
          shouldCapture = true;
        } else {
          // There's still time left. Bubble to the next boundary.
          shouldCapture = false;
        }

        if (shouldCapture) {
          // Scan the list of effects and capture the promises.
          let promises = null;
          let previousEffect = null;
          let effect = workInProgress.firstEffect;
          while (effect !== null) {
            const algebraicEffectTag = effect.effectTag & AlgebraicEffectMask;
            switch (algebraicEffectTag) {
              case Suspend:
              case Loading:
                const promise = effect.thrownValue;
                if (promises === null) {
                  promises = [promise];
                } else {
                  promises.push(promise);
                }
                promises.push(promise);
                captureEffect(workInProgress, previousEffect, effect);
                break;
              default:
                break;
            }
            previousEffect = effect;
            effect = effect.nextEffect;
          }
          if (promises !== null) {
            // Store the promises. We'll use these in the commit phase to
            // schedule a recovery effect.
            workInProgress.memoizedState = promises;
            workInProgress.effectTag |= DidCapture;
            // Render the boundary again
            next = workInProgress;
          }
        }

        // If we exit without completing, and a timeout is provided, raise a
        // timeout effect to force an early expiration.
        if (next === null && typeof timeout === 'number') {
          const returnFiber = workInProgress.return;
          if (returnFiber !== null) {
            raiseTimeoutEffect(returnFiber, workInProgress, timeout);
          }
        }
        break;
      }
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
        break;
    }
    return next;
  }
  return {
    exitIncompleteWork,
  };
}
