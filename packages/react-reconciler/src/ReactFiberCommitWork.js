/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Instance,
  TextInstance,
  SuspenseInstance,
  Container,
  ChildSet,
  UpdatePayload,
} from './ReactFiberHostConfig';
import type {Fiber} from './ReactFiber';
import type {FiberRoot} from './ReactFiberRoot';
import type {ExpirationTime} from './ReactFiberExpirationTime';
import type {CapturedValue, CapturedError} from './ReactCapturedValue';
import type {SuspenseState} from './ReactFiberSuspenseComponent';
import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {Thenable} from './ReactFiberWorkLoop';
import type {ReactPriorityLevel} from './SchedulerWithReactIntegration';

import {unstable_wrap as Schedule_tracing_wrap} from 'scheduler/tracing';
import {
  deferPassiveEffectCleanupDuringUnmount,
  enableSchedulerTracing,
  enableProfilerTimer,
  enableSuspenseServerRenderer,
  enableDeprecatedFlareAPI,
  enableFundamentalAPI,
  enableSuspenseCallback,
  enableScopeAPI,
  runAllPassiveEffectDestroysBeforeCreates,
} from 'shared/ReactFeatureFlags';
import {
  FunctionComponent,
  ForwardRef,
  ClassComponent,
  HostRoot,
  HostComponent,
  HostText,
  HostPortal,
  Profiler,
  SuspenseComponent,
  DehydratedFragment,
  IncompleteClassComponent,
  MemoComponent,
  SimpleMemoComponent,
  SuspenseListComponent,
  FundamentalComponent,
  ScopeComponent,
  Block,
} from 'shared/ReactWorkTags';
import {
  invokeGuardedCallback,
  hasCaughtError,
  clearCaughtError,
} from 'shared/ReactErrorUtils';
import {
  NoEffect,
  ContentReset,
  Placement,
  Snapshot,
  Update,
  Passive,
} from 'shared/ReactSideEffectTags';
import getComponentName from 'shared/getComponentName';
import invariant from 'shared/invariant';

import {onCommitUnmount} from './ReactFiberDevToolsHook';
import {startPhaseTimer, stopPhaseTimer} from './ReactDebugFiberPerf';
import {getStackByFiberInDevAndProd} from './ReactCurrentFiber';
import {logCapturedError} from './ReactFiberErrorLogger';
import {resolveDefaultProps} from './ReactFiberLazyComponent';
import {getCommitTime} from './ReactProfilerTimer';
import {commitUpdateQueue} from './ReactUpdateQueue';
import {
  getPublicInstance,
  supportsMutation,
  supportsPersistence,
  supportsHydration,
  commitMount,
  commitUpdate,
  resetTextContent,
  commitTextUpdate,
  appendChild,
  appendChildToContainer,
  insertBefore,
  insertInContainerBefore,
  removeChild,
  removeChildFromContainer,
  clearSuspenseBoundary,
  clearSuspenseBoundaryFromContainer,
  replaceContainerChildren,
  createContainerChildSet,
  hideInstance,
  hideTextInstance,
  unhideInstance,
  unhideTextInstance,
  unmountFundamentalComponent,
  updateFundamentalComponent,
  commitHydratedContainer,
  commitHydratedSuspenseInstance,
  beforeRemoveInstance,
} from './ReactFiberHostConfig';
import {
  captureCommitPhaseError,
  resolveRetryThenable,
  markCommitTimeOfFallback,
  enqueuePendingPassiveHookEffectMount,
  enqueuePendingPassiveHookEffectUnmount,
} from './ReactFiberWorkLoop';
import {
  NoEffect as NoHookEffect,
  HasEffect as HookHasEffect,
  Layout as HookLayout,
  Passive as HookPassive,
} from './ReactHookEffectTags';
import {didWarnAboutReassigningProps} from './ReactFiberBeginWork';
import {runWithPriority, NormalPriority} from './SchedulerWithReactIntegration';
import {
  updateDeprecatedEventListeners,
  unmountDeprecatedResponderListeners,
} from './ReactFiberDeprecatedEvents';

let didWarnAboutUndefinedSnapshotBeforeUpdate: Set<mixed> | null = null;
if (__DEV__) {
  didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}

const PossiblyWeakSet = typeof WeakSet === 'function' ? WeakSet : Set;

export function logError(boundary: Fiber, errorInfo: CapturedValue<mixed>) {
  const source = errorInfo.source;
  let stack = errorInfo.stack;
  if (stack === null && source !== null) {
    stack = getStackByFiberInDevAndProd(source);
  }

  const capturedError: CapturedError = {
    componentName: source !== null ? getComponentName(source.type) : null,
    componentStack: stack !== null ? stack : '',
    error: errorInfo.value,
    errorBoundary: null,
    errorBoundaryName: null,
    errorBoundaryFound: false,
    willRetry: false,
  };

  if (boundary !== null && boundary.tag === ClassComponent) {
    capturedError.errorBoundary = boundary.stateNode;
    capturedError.errorBoundaryName = getComponentName(boundary.type);
    capturedError.errorBoundaryFound = true;
    capturedError.willRetry = true;
  }

  try {
    logCapturedError(capturedError);
  } catch (e) {
    // This method must not throw, or React internal state will get messed up.
    // If console.error is overridden, or logCapturedError() shows a dialog that throws,
    // we want to report this error outside of the normal stack as a last resort.
    // https://github.com/facebook/react/issues/13188
    setTimeout(() => {
      throw e;
    });
  }
}

const callComponentWillUnmountWithTimer = function(current, instance) {
  startPhaseTimer(current, 'componentWillUnmount');
  instance.props = current.memoizedProps;
  instance.state = current.memoizedState;
  instance.componentWillUnmount();
  stopPhaseTimer();
};

// Capture errors so they don't interrupt unmounting.
function safelyCallComponentWillUnmount(current, instance) {
  if (__DEV__) {
    invokeGuardedCallback(
      null,
      callComponentWillUnmountWithTimer,
      null,
      current,
      instance,
    );
    if (hasCaughtError()) {
      const unmountError = clearCaughtError();
      captureCommitPhaseError(current, unmountError);
    }
  } else {
    try {
      callComponentWillUnmountWithTimer(current, instance);
    } catch (unmountError) {
      captureCommitPhaseError(current, unmountError);
    }
  }
}

function safelyDetachRef(current: Fiber) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
      if (__DEV__) {
        invokeGuardedCallback(null, ref, null, null);
        if (hasCaughtError()) {
          const refError = clearCaughtError();
          captureCommitPhaseError(current, refError);
        }
      } else {
        try {
          ref(null);
        } catch (refError) {
          captureCommitPhaseError(current, refError);
        }
      }
    } else {
      ref.current = null;
    }
  }
}

function safelyCallDestroy(current, destroy) {
  if (__DEV__) {
    invokeGuardedCallback(null, destroy, null);
    if (hasCaughtError()) {
      const error = clearCaughtError();
      captureCommitPhaseError(current, error);
    }
  } else {
    try {
      destroy();
    } catch (error) {
      captureCommitPhaseError(current, error);
    }
  }
}

function commitBeforeMutationLifeCycles(
  current: Fiber | null,
  finishedWork: Fiber,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      return;
    }
    case ClassComponent: {
      if (finishedWork.effectTag & Snapshot) {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          startPhaseTimer(finishedWork, 'getSnapshotBeforeUpdate');
          const instance = finishedWork.stateNode;
          // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.
          if (__DEV__) {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              if (instance.props !== finishedWork.memoizedProps) {
                console.error(
                  'Expected %s props to match memoized props before ' +
                    'getSnapshotBeforeUpdate. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
              if (instance.state !== finishedWork.memoizedState) {
                console.error(
                  'Expected %s state to match memoized state before ' +
                    'getSnapshotBeforeUpdate. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
            }
          }
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );
          if (__DEV__) {
            const didWarnSet = ((didWarnAboutUndefinedSnapshotBeforeUpdate: any): Set<mixed>);
            if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
              didWarnSet.add(finishedWork.type);
              console.error(
                '%s.getSnapshotBeforeUpdate(): A snapshot value (or null) ' +
                  'must be returned. You have returned undefined.',
                getComponentName(finishedWork.type),
              );
            }
          }
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
          stopPhaseTimer();
        }
      }
      return;
    }
    case HostRoot:
    case HostComponent:
    case HostText:
    case HostPortal:
    case IncompleteClassComponent:
      // Nothing to do for these component types
      return;
  }
  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.',
  );
}

function commitHookEffectListUnmount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function commitHookEffectListMount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Mount
        const create = effect.create;
        effect.destroy = create();

        if (__DEV__) {
          const destroy = effect.destroy;
          if (destroy !== undefined && typeof destroy !== 'function') {
            let addendum;
            if (destroy === null) {
              addendum =
                ' You returned null. If your effect does not require clean ' +
                'up, return undefined (or nothing).';
            } else if (typeof destroy.then === 'function') {
              addendum =
                '\n\nIt looks like you wrote useEffect(async () => ...) or returned a Promise. ' +
                'Instead, write the async function inside your effect ' +
                'and call it immediately:\n\n' +
                'useEffect(() => {\n' +
                '  async function fetchData() {\n' +
                '    // You can await here\n' +
                '    const response = await MyAPI.getData(someId);\n' +
                '    // ...\n' +
                '  }\n' +
                '  fetchData();\n' +
                `}, [someId]); // Or [] if effect doesn't need props or state\n\n` +
                'Learn more about data fetching with Hooks: https://fb.me/react-hooks-data-fetching';
            } else {
              addendum = ' You returned: ' + destroy;
            }
            console.error(
              'An effect function must not return anything besides a function, ' +
                'which is used for clean-up.%s%s',
              addendum,
              getStackByFiberInDevAndProd(finishedWork),
            );
          }
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

function schedulePassiveEffects(finishedWork: Fiber) {
  if (runAllPassiveEffectDestroysBeforeCreates) {
    const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
    let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
      const firstEffect = lastEffect.next;
      let effect = firstEffect;
      do {
        const {next, tag} = effect;
        if (
          (tag & HookPassive) !== NoHookEffect &&
          (tag & HookHasEffect) !== NoHookEffect
        ) {
          enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
          enqueuePendingPassiveHookEffectMount(finishedWork, effect);
        }
        effect = next;
      } while (effect !== firstEffect);
    }
  }
}

export function commitPassiveHookEffects(finishedWork: Fiber): void {
  if ((finishedWork.effectTag & Passive) !== NoEffect) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case SimpleMemoComponent:
      case Block: {
        // TODO (#17945) We should call all passive destroy functions (for all fibers)
        // before calling any create functions. The current approach only serializes
        // these for a single fiber.
        commitHookEffectListUnmount(HookPassive | HookHasEffect, finishedWork);
        commitHookEffectListMount(HookPassive | HookHasEffect, finishedWork);
        break;
      }
      default:
        break;
    }
  }
}

function commitLifeCycles(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedExpirationTime: ExpirationTime,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      // At this point layout effects have already been destroyed (during mutation phase).
      // This is done to prevent sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);

      if (runAllPassiveEffectDestroysBeforeCreates) {
        schedulePassiveEffects(finishedWork);
      }
      return;
    }
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      if (finishedWork.effectTag & Update) {
        if (current === null) {
          startPhaseTimer(finishedWork, 'componentDidMount');
          // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.
          if (__DEV__) {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              if (instance.props !== finishedWork.memoizedProps) {
                console.error(
                  'Expected %s props to match memoized props before ' +
                    'componentDidMount. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
              if (instance.state !== finishedWork.memoizedState) {
                console.error(
                  'Expected %s state to match memoized state before ' +
                    'componentDidMount. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
            }
          }
          instance.componentDidMount();
          stopPhaseTimer();
        } else {
          const prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          const prevState = current.memoizedState;
          startPhaseTimer(finishedWork, 'componentDidUpdate');
          // We could update instance props and state here,
          // but instead we rely on them being set during last render.
          // TODO: revisit this when we implement resuming.
          if (__DEV__) {
            if (
              finishedWork.type === finishedWork.elementType &&
              !didWarnAboutReassigningProps
            ) {
              if (instance.props !== finishedWork.memoizedProps) {
                console.error(
                  'Expected %s props to match memoized props before ' +
                    'componentDidUpdate. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
              if (instance.state !== finishedWork.memoizedState) {
                console.error(
                  'Expected %s state to match memoized state before ' +
                    'componentDidUpdate. ' +
                    'This might either be because of a bug in React, or because ' +
                    'a component reassigns its own `this.props`. ' +
                    'Please file an issue.',
                  getComponentName(finishedWork.type) || 'instance',
                );
              }
            }
          }
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
          stopPhaseTimer();
        }
      }
      const updateQueue = finishedWork.updateQueue;
      if (updateQueue !== null) {
        if (__DEV__) {
          if (
            finishedWork.type === finishedWork.elementType &&
            !didWarnAboutReassigningProps
          ) {
            if (instance.props !== finishedWork.memoizedProps) {
              console.error(
                'Expected %s props to match memoized props before ' +
                  'processing the update queue. ' +
                  'This might either be because of a bug in React, or because ' +
                  'a component reassigns its own `this.props`. ' +
                  'Please file an issue.',
                getComponentName(finishedWork.type) || 'instance',
              );
            }
            if (instance.state !== finishedWork.memoizedState) {
              console.error(
                'Expected %s state to match memoized state before ' +
                  'processing the update queue. ' +
                  'This might either be because of a bug in React, or because ' +
                  'a component reassigns its own `this.props`. ' +
                  'Please file an issue.',
                getComponentName(finishedWork.type) || 'instance',
              );
            }
          }
        }
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostRoot: {
      const updateQueue = finishedWork.updateQueue;
      if (updateQueue !== null) {
        let instance = null;
        if (finishedWork.child !== null) {
          switch (finishedWork.child.tag) {
            case HostComponent:
              instance = getPublicInstance(finishedWork.child.stateNode);
              break;
            case ClassComponent:
              instance = finishedWork.child.stateNode;
              break;
          }
        }
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;

      // Renderers may schedule work to be done after host components are mounted
      // (eg DOM renderer may schedule auto-focus for inputs and form controls).
      // These effects should only be committed when components are first mounted,
      // aka when there is no current/alternate.
      if (current === null && finishedWork.effectTag & Update) {
        const type = finishedWork.type;
        const props = finishedWork.memoizedProps;
        commitMount(instance, type, props, finishedWork);
      }

      return;
    }
    case HostText: {
      // We have no life-cycles associated with text.
      return;
    }
    case HostPortal: {
      // We have no life-cycles associated with portals.
      return;
    }
    case Profiler: {
      if (enableProfilerTimer) {
        const onRender = finishedWork.memoizedProps.onRender;

        if (typeof onRender === 'function') {
          if (enableSchedulerTracing) {
            onRender(
              finishedWork.memoizedProps.id,
              current === null ? 'mount' : 'update',
              finishedWork.actualDuration,
              finishedWork.treeBaseDuration,
              finishedWork.actualStartTime,
              getCommitTime(),
              finishedRoot.memoizedInteractions,
            );
          } else {
            onRender(
              finishedWork.memoizedProps.id,
              current === null ? 'mount' : 'update',
              finishedWork.actualDuration,
              finishedWork.treeBaseDuration,
              finishedWork.actualStartTime,
              getCommitTime(),
            );
          }
        }
      }
      return;
    }
    case SuspenseComponent: {
      commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
      return;
    }
    case SuspenseListComponent:
    case IncompleteClassComponent:
    case FundamentalComponent:
    case ScopeComponent:
      return;
  }
  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.',
  );
}

function hideOrUnhideAllChildren(finishedWork, isHidden) {
  if (supportsMutation) {
    // We only have the top Fiber that was inserted but we need to recurse down its
    // children to find all the terminal nodes.
    let node: Fiber = finishedWork;
    while (true) {
      if (node.tag === HostComponent) {
        const instance = node.stateNode;
        if (isHidden) {
          hideInstance(instance);
        } else {
          unhideInstance(node.stateNode, node.memoizedProps);
        }
      } else if (node.tag === HostText) {
        const instance = node.stateNode;
        if (isHidden) {
          hideTextInstance(instance);
        } else {
          unhideTextInstance(instance, node.memoizedProps);
        }
      } else if (
        node.tag === SuspenseComponent &&
        node.memoizedState !== null &&
        node.memoizedState.dehydrated === null
      ) {
        // Found a nested Suspense component that timed out. Skip over the
        // primary child fragment, which should remain hidden.
        const fallbackChildFragment: Fiber = (node.child: any).sibling;
        fallbackChildFragment.return = node;
        node = fallbackChildFragment;
        continue;
      } else if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
      if (node === finishedWork) {
        return;
      }
      while (node.sibling === null) {
        if (node.return === null || node.return === finishedWork) {
          return;
        }
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
}

function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    // Moved outside to ensure DCE works with this flag
    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance.methods;
    }
    if (typeof ref === 'function') {
      ref(instanceToUse);
    } else {
      if (__DEV__) {
        if (!ref.hasOwnProperty('current')) {
          console.error(
            'Unexpected ref object provided for %s. ' +
              'Use either a ref-setter function or React.createRef().%s',
            getComponentName(finishedWork.type),
            getStackByFiberInDevAndProd(finishedWork),
          );
        }
      }

      ref.current = instanceToUse;
    }
  }
}

function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
}

// User-originating errors (lifecycles and refs) should not interrupt
// deletion, so don't let them throw. Host-originating errors should
// interrupt deletion, so it's okay
function commitUnmount(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  onCommitUnmount(current);

  switch (current.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      const updateQueue: FunctionComponentUpdateQueue | null = (current.updateQueue: any);
      if (updateQueue !== null) {
        const lastEffect = updateQueue.lastEffect;
        if (lastEffect !== null) {
          const firstEffect = lastEffect.next;

          if (
            deferPassiveEffectCleanupDuringUnmount &&
            runAllPassiveEffectDestroysBeforeCreates
          ) {
            let effect = firstEffect;
            do {
              const {destroy, tag} = effect;
              if (destroy !== undefined) {
                if ((tag & HookPassive) !== NoHookEffect) {
                  enqueuePendingPassiveHookEffectUnmount(current, effect);
                } else {
                  safelyCallDestroy(current, destroy);
                }
              }
              effect = effect.next;
            } while (effect !== firstEffect);
          } else {
            // When the owner fiber is deleted, the destroy function of a passive
            // effect hook is called during the synchronous commit phase. This is
            // a concession to implementation complexity. Calling it in the
            // passive effect phase (like they usually are, when dependencies
            // change during an update) would require either traversing the
            // children of the deleted fiber again, or including unmount effects
            // as part of the fiber effect list.
            //
            // Because this is during the sync commit phase, we need to change
            // the priority.
            //
            // TODO: Reconsider this implementation trade off.
            const priorityLevel =
              renderPriorityLevel > NormalPriority
                ? NormalPriority
                : renderPriorityLevel;
            runWithPriority(priorityLevel, () => {
              let effect = firstEffect;
              do {
                const destroy = effect.destroy;
                if (destroy !== undefined) {
                  safelyCallDestroy(current, destroy);
                }
                effect = effect.next;
              } while (effect !== firstEffect);
            });
          }
        }
      }
      return;
    }
    case ClassComponent: {
      safelyDetachRef(current);
      const instance = current.stateNode;
      if (typeof instance.componentWillUnmount === 'function') {
        safelyCallComponentWillUnmount(current, instance);
      }
      return;
    }
    case HostComponent: {
      if (enableDeprecatedFlareAPI) {
        unmountDeprecatedResponderListeners(current);
        beforeRemoveInstance(current.stateNode);
      }
      safelyDetachRef(current);
      return;
    }
    case HostPortal: {
      // TODO: this is recursive.
      // We are also not using this parent because
      // the portal will get pushed immediately.
      if (supportsMutation) {
        unmountHostComponents(finishedRoot, current, renderPriorityLevel);
      } else if (supportsPersistence) {
        emptyPortalContainer(current);
      }
      return;
    }
    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        const fundamentalInstance = current.stateNode;
        if (fundamentalInstance !== null) {
          unmountFundamentalComponent(fundamentalInstance);
          current.stateNode = null;
        }
      }
      return;
    }
    case DehydratedFragment: {
      if (enableSuspenseCallback) {
        const hydrationCallbacks = finishedRoot.hydrationCallbacks;
        if (hydrationCallbacks !== null) {
          const onDeleted = hydrationCallbacks.onDeleted;
          if (onDeleted) {
            onDeleted((current.stateNode: SuspenseInstance));
          }
        }
      }
      return;
    }
    case ScopeComponent: {
      if (enableDeprecatedFlareAPI) {
        unmountDeprecatedResponderListeners(current);
      }
      if (enableScopeAPI) {
        safelyDetachRef(current);
      }
      return;
    }
  }
}

function commitNestedUnmounts(
  finishedRoot: FiberRoot,
  root: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  // While we're inside a removed host node we don't want to call
  // removeChild on the inner nodes because they're removed by the top
  // call anyway. We also want to call componentWillUnmount on all
  // composites before this host node is removed from the tree. Therefore
  // we do an inner loop while we're still inside the host node.
  let node: Fiber = root;
  while (true) {
    commitUnmount(finishedRoot, node, renderPriorityLevel);
    // Visit children because they may contain more composite or host nodes.
    // Skip portals because commitUnmount() currently visits them recursively.
    if (
      node.child !== null &&
      // If we use mutation we drill down into portals using commitUnmount above.
      // If we don't use mutation we drill down into portals here instead.
      (!supportsMutation || node.tag !== HostPortal)
    ) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === root) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === root) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function detachFiber(current: Fiber) {
  const alternate = current.alternate;
  // Cut off the return pointers to disconnect it from the tree. Ideally, we
  // should clear the child pointer of the parent alternate to let this
  // get GC:ed but we don't know which for sure which parent is the current
  // one so we'll settle for GC:ing the subtree of this child. This child
  // itself will be GC:ed when the parent updates the next time.
  current.return = null;
  current.child = null;
  current.memoizedState = null;
  current.updateQueue = null;
  current.dependencies = null;
  current.alternate = null;
  current.firstEffect = null;
  current.lastEffect = null;
  current.pendingProps = null;
  current.memoizedProps = null;
  current.stateNode = null;
  if (alternate !== null) {
    detachFiber(alternate);
  }
}

function emptyPortalContainer(current: Fiber) {
  if (!supportsPersistence) {
    return;
  }

  const portal: {
    containerInfo: Container,
    pendingChildren: ChildSet,
    ...
  } = current.stateNode;
  const {containerInfo} = portal;
  const emptyChildSet = createContainerChildSet(containerInfo);
  replaceContainerChildren(containerInfo, emptyChildSet);
}

function commitContainer(finishedWork: Fiber) {
  if (!supportsPersistence) {
    return;
  }

  switch (finishedWork.tag) {
    case ClassComponent:
    case HostComponent:
    case HostText:
    case FundamentalComponent: {
      return;
    }
    case HostRoot:
    case HostPortal: {
      const portalOrRoot: {
        containerInfo: Container,
        pendingChildren: ChildSet,
        ...
      } = finishedWork.stateNode;
      const {containerInfo, pendingChildren} = portalOrRoot;
      replaceContainerChildren(containerInfo, pendingChildren);
      return;
    }
  }
  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.',
  );
}

function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  invariant(
    false,
    'Expected to find a host parent. This error is likely caused by a bug ' +
      'in React. Please file an issue.',
  );
}

function isHostParent(fiber: Fiber): boolean {
  return (
    fiber.tag === HostComponent ||
    fiber.tag === HostRoot ||
    fiber.tag === HostPortal
  );
}

function getHostSibling(fiber: Fiber): ?Instance {
  // We're going to search forward into the tree until we find a sibling host
  // node. Unfortunately, if multiple insertions are done in a row we have to
  // search past them. This leads to exponential search for the next sibling.
  // TODO: Find a more efficient way to do this.
  let node: Fiber = fiber;
  siblings: while (true) {
    // If we didn't find anything, let's try the next sibling.
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
    while (
      node.tag !== HostComponent &&
      node.tag !== HostText &&
      node.tag !== DehydratedFragment
    ) {
      // If it is not host node and, we might have a host node inside it.
      // Try to search down until we find one.
      if (node.effectTag & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      }
      // If we don't have a child, try the siblings instead.
      // We also skip portals because they are not part of this host tree.
      if (node.child === null || node.tag === HostPortal) {
        continue siblings;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }
    // Check if this host node is stable or about to be placed.
    if (!(node.effectTag & Placement)) {
      // Found it!
      return node.stateNode;
    }
  }
}

function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }

  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
    // eslint-disable-next-line-no-fallthrough
    default:
      invariant(
        false,
        'Invalid host parent fiber. This error is likely caused by a bug ' +
          'in React. Please file an issue.',
      );
  }
  if (parentFiber.effectTag & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber.effectTag &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}

function insertOrAppendPlacementNodeIntoContainer(
  node: Fiber,
  before: ?Instance,
  parent: Container,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost || (enableFundamentalAPI && tag === FundamentalComponent)) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before) {
      insertInContainerBefore(parent, stateNode, before);
    } else {
      appendChildToContainer(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNodeIntoContainer(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNodeIntoContainer(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function insertOrAppendPlacementNode(
  node: Fiber,
  before: ?Instance,
  parent: Instance,
): void {
  const {tag} = node;
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost || (enableFundamentalAPI && tag === FundamentalComponent)) {
    const stateNode = isHost ? node.stateNode : node.stateNode.instance;
    if (before) {
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else if (tag === HostPortal) {
    // If the insertion itself is a portal, then we don't want to traverse
    // down its children. Instead, we'll get insertions from each child in
    // the portal directly.
  } else {
    const child = node.child;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let sibling = child.sibling;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

function unmountHostComponents(
  finishedRoot,
  current,
  renderPriorityLevel,
): void {
  // We only have the top Fiber that was deleted but we need to recurse down its
  // children to find all the terminal nodes.
  let node: Fiber = current;

  // Each iteration, currentParent is populated with node's host parent if not
  // currentParentIsValid.
  let currentParentIsValid = false;

  // Note: these two variables *must* always be updated together.
  let currentParent;
  let currentParentIsContainer;

  while (true) {
    if (!currentParentIsValid) {
      let parent = node.return;
      findParent: while (true) {
        invariant(
          parent !== null,
          'Expected to find a host parent. This error is likely caused by ' +
            'a bug in React. Please file an issue.',
        );
        const parentStateNode = parent.stateNode;
        switch (parent.tag) {
          case HostComponent:
            currentParent = parentStateNode;
            currentParentIsContainer = false;
            break findParent;
          case HostRoot:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;
          case HostPortal:
            currentParent = parentStateNode.containerInfo;
            currentParentIsContainer = true;
            break findParent;
          case FundamentalComponent:
            if (enableFundamentalAPI) {
              currentParent = parentStateNode.instance;
              currentParentIsContainer = false;
            }
        }
        parent = parent.return;
      }
      currentParentIsValid = true;
    }

    if (node.tag === HostComponent || node.tag === HostText) {
      commitNestedUnmounts(finishedRoot, node, renderPriorityLevel);
      // After all the children have unmounted, it is now safe to remove the
      // node from the tree.
      if (currentParentIsContainer) {
        removeChildFromContainer(
          ((currentParent: any): Container),
          (node.stateNode: Instance | TextInstance),
        );
      } else {
        removeChild(
          ((currentParent: any): Instance),
          (node.stateNode: Instance | TextInstance),
        );
      }
      // Don't visit children because we already visited them.
    } else if (enableFundamentalAPI && node.tag === FundamentalComponent) {
      const fundamentalNode = node.stateNode.instance;
      commitNestedUnmounts(finishedRoot, node, renderPriorityLevel);
      // After all the children have unmounted, it is now safe to remove the
      // node from the tree.
      if (currentParentIsContainer) {
        removeChildFromContainer(
          ((currentParent: any): Container),
          (fundamentalNode: Instance),
        );
      } else {
        removeChild(
          ((currentParent: any): Instance),
          (fundamentalNode: Instance),
        );
      }
    } else if (
      enableSuspenseServerRenderer &&
      node.tag === DehydratedFragment
    ) {
      if (enableSuspenseCallback) {
        const hydrationCallbacks = finishedRoot.hydrationCallbacks;
        if (hydrationCallbacks !== null) {
          const onDeleted = hydrationCallbacks.onDeleted;
          if (onDeleted) {
            onDeleted((node.stateNode: SuspenseInstance));
          }
        }
      }

      // Delete the dehydrated suspense boundary and all of its content.
      if (currentParentIsContainer) {
        clearSuspenseBoundaryFromContainer(
          ((currentParent: any): Container),
          (node.stateNode: SuspenseInstance),
        );
      } else {
        clearSuspenseBoundary(
          ((currentParent: any): Instance),
          (node.stateNode: SuspenseInstance),
        );
      }
    } else if (node.tag === HostPortal) {
      if (node.child !== null) {
        // When we go into a portal, it becomes the parent to remove from.
        // We will reassign it back when we pop the portal on the way up.
        currentParent = node.stateNode.containerInfo;
        currentParentIsContainer = true;
        // Visit children because portals might contain host components.
        node.child.return = node;
        node = node.child;
        continue;
      }
    } else {
      commitUnmount(finishedRoot, node, renderPriorityLevel);
      // Visit children because we may find more host components below.
      if (node.child !== null) {
        node.child.return = node;
        node = node.child;
        continue;
      }
    }
    if (node === current) {
      return;
    }
    while (node.sibling === null) {
      if (node.return === null || node.return === current) {
        return;
      }
      node = node.return;
      if (node.tag === HostPortal) {
        // When we go out of the portal, we need to restore the parent.
        // Since we don't keep a stack of them, we will search for it.
        currentParentIsValid = false;
      }
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}

function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  if (supportsMutation) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  } else {
    // Detach refs and call componentWillUnmount() on the whole subtree.
    commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
  }
  detachFiber(current);
}

function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  if (!supportsMutation) {
    switch (finishedWork.tag) {
      case FunctionComponent:
      case ForwardRef:
      case MemoComponent:
      case SimpleMemoComponent:
      case Block: {
        // Layout effects are destroyed during the mutation phase so that all
        // destroy functions for all fibers are called before any create functions.
        // This prevents sibling component effects from interfering with each other,
        // e.g. a destroy function in one component should never override a ref set
        // by a create function in another component during the same commit.
        commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
        return;
      }
      case Profiler: {
        return;
      }
      case SuspenseComponent: {
        commitSuspenseComponent(finishedWork);
        attachSuspenseRetryListeners(finishedWork);
        return;
      }
      case SuspenseListComponent: {
        attachSuspenseRetryListeners(finishedWork);
        return;
      }
      case HostRoot: {
        if (supportsHydration) {
          const root: FiberRoot = finishedWork.stateNode;
          if (root.hydrate) {
            // We've just hydrated. No need to hydrate again.
            root.hydrate = false;
            commitHydratedContainer(root.containerInfo);
          }
        }
        break;
      }
    }

    commitContainer(finishedWork);
    return;
  }

  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      // Layout effects are destroyed during the mutation phase so that all
      // destroy functions for all fibers are called before any create functions.
      // This prevents sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
      return;
    }
    case ClassComponent: {
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // TODO: Type the updateQueue to be specific to host components.
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue: any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
        if (enableDeprecatedFlareAPI) {
          const prevListeners = oldProps.DEPRECATED_flareListeners;
          const nextListeners = newProps.DEPRECATED_flareListeners;
          if (prevListeners !== nextListeners) {
            updateDeprecatedEventListeners(nextListeners, finishedWork, null);
          }
        }
      }
      return;
    }
    case HostText: {
      invariant(
        finishedWork.stateNode !== null,
        'This should have a text node initialized. This error is likely ' +
          'caused by a bug in React. Please file an issue.',
      );
      const textInstance: TextInstance = finishedWork.stateNode;
      const newText: string = finishedWork.memoizedProps;
      // For hydration we reuse the update path but we treat the oldProps
      // as the newProps. The updatePayload will contain the real change in
      // this case.
      const oldText: string =
        current !== null ? current.memoizedProps : newText;
      commitTextUpdate(textInstance, oldText, newText);
      return;
    }
    case HostRoot: {
      if (supportsHydration) {
        const root: FiberRoot = finishedWork.stateNode;
        if (root.hydrate) {
          // We've just hydrated. No need to hydrate again.
          root.hydrate = false;
          commitHydratedContainer(root.containerInfo);
        }
      }
      return;
    }
    case Profiler: {
      return;
    }
    case SuspenseComponent: {
      commitSuspenseComponent(finishedWork);
      attachSuspenseRetryListeners(finishedWork);
      return;
    }
    case SuspenseListComponent: {
      attachSuspenseRetryListeners(finishedWork);
      return;
    }
    case IncompleteClassComponent: {
      return;
    }
    case FundamentalComponent: {
      if (enableFundamentalAPI) {
        const fundamentalInstance = finishedWork.stateNode;
        updateFundamentalComponent(fundamentalInstance);
        return;
      }
      break;
    }
    case ScopeComponent: {
      if (enableScopeAPI) {
        const scopeInstance = finishedWork.stateNode;
        scopeInstance.fiber = finishedWork;
        if (enableDeprecatedFlareAPI) {
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const prevListeners = oldProps.DEPRECATED_flareListeners;
          const nextListeners = newProps.DEPRECATED_flareListeners;
          if (prevListeners !== nextListeners || current === null) {
            updateDeprecatedEventListeners(nextListeners, finishedWork, null);
          }
        }
        return;
      }
      break;
    }
  }
  invariant(
    false,
    'This unit of work tag should not have side-effects. This error is ' +
      'likely caused by a bug in React. Please file an issue.',
  );
}

function commitSuspenseComponent(finishedWork: Fiber) {
  let newState: SuspenseState | null = finishedWork.memoizedState;

  let newDidTimeout;
  let primaryChildParent = finishedWork;
  if (newState === null) {
    newDidTimeout = false;
  } else {
    newDidTimeout = true;
    primaryChildParent = finishedWork.child;
    markCommitTimeOfFallback();
  }

  if (supportsMutation && primaryChildParent !== null) {
    hideOrUnhideAllChildren(primaryChildParent, newDidTimeout);
  }

  if (enableSuspenseCallback && newState !== null) {
    const suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
    if (typeof suspenseCallback === 'function') {
      const thenables: Set<Thenable> | null = (finishedWork.updateQueue: any);
      if (thenables !== null) {
        suspenseCallback(new Set(thenables));
      }
    } else if (__DEV__) {
      if (suspenseCallback !== undefined) {
        console.error('Unexpected type for suspenseCallback.');
      }
    }
  }
}

function commitSuspenseHydrationCallbacks(
  finishedRoot: FiberRoot,
  finishedWork: Fiber,
) {
  if (!supportsHydration) {
    return;
  }
  const newState: SuspenseState | null = finishedWork.memoizedState;
  if (newState === null) {
    const current = finishedWork.alternate;
    if (current !== null) {
      const prevState: SuspenseState | null = current.memoizedState;
      if (prevState !== null) {
        const suspenseInstance = prevState.dehydrated;
        if (suspenseInstance !== null) {
          commitHydratedSuspenseInstance(suspenseInstance);
          if (enableSuspenseCallback) {
            const hydrationCallbacks = finishedRoot.hydrationCallbacks;
            if (hydrationCallbacks !== null) {
              const onHydrated = hydrationCallbacks.onHydrated;
              if (onHydrated) {
                onHydrated(suspenseInstance);
              }
            }
          }
        }
      }
    }
  }
}

function attachSuspenseRetryListeners(finishedWork: Fiber) {
  // If this boundary just timed out, then it will have a set of thenables.
  // For each thenable, attach a listener so that when it resolves, React
  // attempts to re-render the boundary in the primary (pre-timeout) state.
  const thenables: Set<Thenable> | null = (finishedWork.updateQueue: any);
  if (thenables !== null) {
    finishedWork.updateQueue = null;
    let retryCache = finishedWork.stateNode;
    if (retryCache === null) {
      retryCache = finishedWork.stateNode = new PossiblyWeakSet();
    }
    thenables.forEach(thenable => {
      // Memoize using the boundary fiber to prevent redundant listeners.
      let retry = resolveRetryThenable.bind(null, finishedWork, thenable);
      if (!retryCache.has(thenable)) {
        if (enableSchedulerTracing) {
          if (thenable.__reactDoNotTraceInteractions !== true) {
            retry = Schedule_tracing_wrap(retry);
          }
        }
        retryCache.add(thenable);
        thenable.then(retry, retry);
      }
    });
  }
}

function commitResetTextContent(current: Fiber) {
  if (!supportsMutation) {
    return;
  }
  resetTextContent(current.stateNode);
}

export {
  commitBeforeMutationLifeCycles,
  commitResetTextContent,
  commitPlacement,
  commitDeletion,
  commitWork,
  commitLifeCycles,
  commitAttachRef,
  commitDetachRef,
};
