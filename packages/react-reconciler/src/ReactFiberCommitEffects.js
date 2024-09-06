/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Fiber} from './ReactInternalTypes';
import type {UpdateQueue} from './ReactFiberClassUpdateQueue';
import type {FunctionComponentUpdateQueue} from './ReactFiberHooks';
import type {HookFlags} from './ReactHookEffectTags';

import {
  enableProfilerTimer,
  enableProfilerCommitHooks,
  enableProfilerNestedUpdatePhase,
  enableSchedulingProfiler,
  enableScopeAPI,
  disableStringRefs,
} from 'shared/ReactFeatureFlags';
import {
  ClassComponent,
  HostComponent,
  HostHoistable,
  HostSingleton,
  ScopeComponent,
} from './ReactWorkTags';
import {NoFlags} from './ReactFiberFlags';
import getComponentNameFromFiber from 'react-reconciler/src/getComponentNameFromFiber';
import {resolveClassComponentProps} from './ReactFiberClassComponent';
import {
  recordLayoutEffectDuration,
  startLayoutEffectTimer,
  recordPassiveEffectDuration,
  startPassiveEffectTimer,
  isCurrentUpdateNested,
} from './ReactProfilerTimer';
import {NoMode, ProfileMode} from './ReactTypeOfMode';
import {
  commitCallbacks,
  commitHiddenCallbacks,
} from './ReactFiberClassUpdateQueue';
import {getPublicInstance} from './ReactFiberConfig';
import {
  captureCommitPhaseError,
  setIsRunningInsertionEffect,
  getExecutionContext,
  CommitContext,
  NoContext,
} from './ReactFiberWorkLoop';
import {
  NoFlags as NoHookEffect,
  Layout as HookLayout,
  Insertion as HookInsertion,
  Passive as HookPassive,
} from './ReactHookEffectTags';
import {didWarnAboutReassigningProps} from './ReactFiberBeginWork';
import {
  markComponentPassiveEffectMountStarted,
  markComponentPassiveEffectMountStopped,
  markComponentPassiveEffectUnmountStarted,
  markComponentPassiveEffectUnmountStopped,
  markComponentLayoutEffectMountStarted,
  markComponentLayoutEffectMountStopped,
  markComponentLayoutEffectUnmountStarted,
  markComponentLayoutEffectUnmountStopped,
} from './ReactFiberDevToolsHook';
import {
  callComponentDidMountInDEV,
  callComponentDidUpdateInDEV,
  callComponentWillUnmountInDEV,
  callCreateInDEV,
  callDestroyInDEV,
} from './ReactFiberCallUserSpace';

function shouldProfile(current: Fiber): boolean {
  return (
    enableProfilerTimer &&
    enableProfilerCommitHooks &&
    (current.mode & ProfileMode) !== NoMode &&
    (getExecutionContext() & CommitContext) !== NoContext
  );
}

export function commitHookLayoutEffects(
  finishedWork: Fiber,
  hookFlags: HookFlags,
) {
  // At this point layout effects have already been destroyed (during mutation phase).
  // This is done to prevent sibling component effects from interfering with each other,
  // e.g. a destroy function in one component should never override a ref set
  // by a create function in another component during the same commit.
  if (shouldProfile(finishedWork)) {
    startLayoutEffectTimer();
    commitHookEffectListMount(hookFlags, finishedWork);
    recordLayoutEffectDuration(finishedWork);
  } else {
    commitHookEffectListMount(hookFlags, finishedWork);
  }
}

export function commitHookEffectListMount(
  flags: HookFlags,
  finishedWork: Fiber,
) {
  try {
    const updateQueue: FunctionComponentUpdateQueue | null =
      (finishedWork.updateQueue: any);
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
      const firstEffect = lastEffect.next;
      let effect = firstEffect;
      do {
        if ((effect.tag & flags) === flags) {
          if (enableSchedulingProfiler) {
            if ((flags & HookPassive) !== NoHookEffect) {
              markComponentPassiveEffectMountStarted(finishedWork);
            } else if ((flags & HookLayout) !== NoHookEffect) {
              markComponentLayoutEffectMountStarted(finishedWork);
            }
          }

          // Mount
          let destroy;
          if (__DEV__) {
            if ((flags & HookInsertion) !== NoHookEffect) {
              setIsRunningInsertionEffect(true);
            }
            destroy = callCreateInDEV(effect);
            if ((flags & HookInsertion) !== NoHookEffect) {
              setIsRunningInsertionEffect(false);
            }
          } else {
            const create = effect.create;
            const inst = effect.inst;
            destroy = create();
            inst.destroy = destroy;
          }

          if (enableSchedulingProfiler) {
            if ((flags & HookPassive) !== NoHookEffect) {
              markComponentPassiveEffectMountStopped();
            } else if ((flags & HookLayout) !== NoHookEffect) {
              markComponentLayoutEffectMountStopped();
            }
          }

          if (__DEV__) {
            if (destroy !== undefined && typeof destroy !== 'function') {
              let hookName;
              if ((effect.tag & HookLayout) !== NoFlags) {
                hookName = 'useLayoutEffect';
              } else if ((effect.tag & HookInsertion) !== NoFlags) {
                hookName = 'useInsertionEffect';
              } else {
                hookName = 'useEffect';
              }
              let addendum;
              if (destroy === null) {
                addendum =
                  ' You returned null. If your effect does not require clean ' +
                  'up, return undefined (or nothing).';
              } else if (typeof destroy.then === 'function') {
                addendum =
                  '\n\nIt looks like you wrote ' +
                  hookName +
                  '(async () => ...) or returned a Promise. ' +
                  'Instead, write the async function inside your effect ' +
                  'and call it immediately:\n\n' +
                  hookName +
                  '(() => {\n' +
                  '  async function fetchData() {\n' +
                  '    // You can await here\n' +
                  '    const response = await MyAPI.getData(someId);\n' +
                  '    // ...\n' +
                  '  }\n' +
                  '  fetchData();\n' +
                  `}, [someId]); // Or [] if effect doesn't need props or state\n\n` +
                  'Learn more about data fetching with Hooks: https://react.dev/link/hooks-data-fetching';
              } else {
                addendum = ' You returned: ' + destroy;
              }
              console.error(
                '%s must not return anything besides a function, ' +
                  'which is used for clean-up.%s',
                hookName,
                addendum,
              );
            }
          }
        }
        effect = effect.next;
      } while (effect !== firstEffect);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHookEffectListUnmount(
  flags: HookFlags,
  finishedWork: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  try {
    const updateQueue: FunctionComponentUpdateQueue | null =
      (finishedWork.updateQueue: any);
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
    if (lastEffect !== null) {
      const firstEffect = lastEffect.next;
      let effect = firstEffect;
      do {
        if ((effect.tag & flags) === flags) {
          // Unmount
          const inst = effect.inst;
          const destroy = inst.destroy;
          if (destroy !== undefined) {
            inst.destroy = undefined;
            if (enableSchedulingProfiler) {
              if ((flags & HookPassive) !== NoHookEffect) {
                markComponentPassiveEffectUnmountStarted(finishedWork);
              } else if ((flags & HookLayout) !== NoHookEffect) {
                markComponentLayoutEffectUnmountStarted(finishedWork);
              }
            }

            if (__DEV__) {
              if ((flags & HookInsertion) !== NoHookEffect) {
                setIsRunningInsertionEffect(true);
              }
            }
            safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
            if (__DEV__) {
              if ((flags & HookInsertion) !== NoHookEffect) {
                setIsRunningInsertionEffect(false);
              }
            }

            if (enableSchedulingProfiler) {
              if ((flags & HookPassive) !== NoHookEffect) {
                markComponentPassiveEffectUnmountStopped();
              } else if ((flags & HookLayout) !== NoHookEffect) {
                markComponentLayoutEffectUnmountStopped();
              }
            }
          }
        }
        effect = effect.next;
      } while (effect !== firstEffect);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

export function commitHookPassiveMountEffects(
  finishedWork: Fiber,
  hookFlags: HookFlags,
) {
  if (shouldProfile(finishedWork)) {
    startPassiveEffectTimer();
    commitHookEffectListMount(hookFlags, finishedWork);
    recordPassiveEffectDuration(finishedWork);
  } else {
    commitHookEffectListMount(hookFlags, finishedWork);
  }
}

export function commitHookPassiveUnmountEffects(
  finishedWork: Fiber,
  nearestMountedAncestor: null | Fiber,
  hookFlags: HookFlags,
) {
  if (shouldProfile(finishedWork)) {
    startPassiveEffectTimer();
    commitHookEffectListUnmount(
      hookFlags,
      finishedWork,
      nearestMountedAncestor,
    );
    recordPassiveEffectDuration(finishedWork);
  } else {
    commitHookEffectListUnmount(
      hookFlags,
      finishedWork,
      nearestMountedAncestor,
    );
  }
}

export function commitClassLayoutLifecycles(
  finishedWork: Fiber,
  current: Fiber | null,
) {
  const instance = finishedWork.stateNode;
  if (current === null) {
    // We could update instance props and state here,
    // but instead we rely on them being set during last render.
    // TODO: revisit this when we implement resuming.
    if (__DEV__) {
      if (
        !finishedWork.type.defaultProps &&
        !('ref' in finishedWork.memoizedProps) &&
        !didWarnAboutReassigningProps
      ) {
        if (instance.props !== finishedWork.memoizedProps) {
          console.error(
            'Expected %s props to match memoized props before ' +
              'componentDidMount. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.props`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
        if (instance.state !== finishedWork.memoizedState) {
          console.error(
            'Expected %s state to match memoized state before ' +
              'componentDidMount. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.state`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
      }
    }
    if (shouldProfile(finishedWork)) {
      startLayoutEffectTimer();
      if (__DEV__) {
        callComponentDidMountInDEV(finishedWork, instance);
      } else {
        try {
          instance.componentDidMount();
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      recordLayoutEffectDuration(finishedWork);
    } else {
      if (__DEV__) {
        callComponentDidMountInDEV(finishedWork, instance);
      } else {
        try {
          instance.componentDidMount();
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }
  } else {
    const prevProps = resolveClassComponentProps(
      finishedWork.type,
      current.memoizedProps,
      finishedWork.elementType === finishedWork.type,
    );
    const prevState = current.memoizedState;
    // We could update instance props and state here,
    // but instead we rely on them being set during last render.
    // TODO: revisit this when we implement resuming.
    if (__DEV__) {
      if (
        !finishedWork.type.defaultProps &&
        !('ref' in finishedWork.memoizedProps) &&
        !didWarnAboutReassigningProps
      ) {
        if (instance.props !== finishedWork.memoizedProps) {
          console.error(
            'Expected %s props to match memoized props before ' +
              'componentDidUpdate. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.props`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
        if (instance.state !== finishedWork.memoizedState) {
          console.error(
            'Expected %s state to match memoized state before ' +
              'componentDidUpdate. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.state`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
      }
    }
    if (shouldProfile(finishedWork)) {
      startLayoutEffectTimer();
      if (__DEV__) {
        callComponentDidUpdateInDEV(
          finishedWork,
          instance,
          prevProps,
          prevState,
          instance.__reactInternalSnapshotBeforeUpdate,
        );
      } else {
        try {
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      recordLayoutEffectDuration(finishedWork);
    } else {
      if (__DEV__) {
        callComponentDidUpdateInDEV(
          finishedWork,
          instance,
          prevProps,
          prevState,
          instance.__reactInternalSnapshotBeforeUpdate,
        );
      } else {
        try {
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
    }
  }
}

export function commitClassDidMount(finishedWork: Fiber) {
  // TODO: Check for LayoutStatic flag
  const instance = finishedWork.stateNode;
  if (typeof instance.componentDidMount === 'function') {
    if (__DEV__) {
      callComponentDidMountInDEV(finishedWork, instance);
    } else {
      try {
        instance.componentDidMount();
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
    }
  }
}

export function commitClassCallbacks(finishedWork: Fiber) {
  // TODO: I think this is now always non-null by the time it reaches the
  // commit phase. Consider removing the type check.
  const updateQueue: UpdateQueue<mixed> | null =
    (finishedWork.updateQueue: any);
  if (updateQueue !== null) {
    const instance = finishedWork.stateNode;
    if (__DEV__) {
      if (
        !finishedWork.type.defaultProps &&
        !('ref' in finishedWork.memoizedProps) &&
        !didWarnAboutReassigningProps
      ) {
        if (instance.props !== finishedWork.memoizedProps) {
          console.error(
            'Expected %s props to match memoized props before ' +
              'processing the update queue. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.props`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
        if (instance.state !== finishedWork.memoizedState) {
          console.error(
            'Expected %s state to match memoized state before ' +
              'processing the update queue. ' +
              'This might either be because of a bug in React, or because ' +
              'a component reassigns its own `this.state`. ' +
              'Please file an issue.',
            getComponentNameFromFiber(finishedWork) || 'instance',
          );
        }
      }
    }
    // We could update instance props and state here,
    // but instead we rely on them being set during last render.
    // TODO: revisit this when we implement resuming.
    try {
      commitCallbacks(updateQueue, instance);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}

export function commitClassHiddenCallbacks(finishedWork: Fiber) {
  // Commit any callbacks that would have fired while the component
  // was hidden.
  const updateQueue: UpdateQueue<mixed> | null =
    (finishedWork.updateQueue: any);
  if (updateQueue !== null) {
    const instance = finishedWork.stateNode;
    try {
      commitHiddenCallbacks(updateQueue, instance);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}

export function commitRootCallbacks(finishedWork: Fiber) {
  // TODO: I think this is now always non-null by the time it reaches the
  // commit phase. Consider removing the type check.
  const updateQueue: UpdateQueue<mixed> | null =
    (finishedWork.updateQueue: any);
  if (updateQueue !== null) {
    let instance = null;
    if (finishedWork.child !== null) {
      switch (finishedWork.child.tag) {
        case HostSingleton:
        case HostComponent:
          instance = getPublicInstance(finishedWork.child.stateNode);
          break;
        case ClassComponent:
          instance = finishedWork.child.stateNode;
          break;
      }
    }
    try {
      commitCallbacks(updateQueue, instance);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}

let didWarnAboutUndefinedSnapshotBeforeUpdate: Set<mixed> | null = null;
if (__DEV__) {
  didWarnAboutUndefinedSnapshotBeforeUpdate = new Set();
}

export function commitClassSnapshot(finishedWork: Fiber, current: Fiber) {
  const prevProps = current.memoizedProps;
  const prevState = current.memoizedState;
  const instance = finishedWork.stateNode;
  // We could update instance props and state here,
  // but instead we rely on them being set during last render.
  // TODO: revisit this when we implement resuming.
  if (__DEV__) {
    if (
      !finishedWork.type.defaultProps &&
      !('ref' in finishedWork.memoizedProps) &&
      !didWarnAboutReassigningProps
    ) {
      if (instance.props !== finishedWork.memoizedProps) {
        console.error(
          'Expected %s props to match memoized props before ' +
            'getSnapshotBeforeUpdate. ' +
            'This might either be because of a bug in React, or because ' +
            'a component reassigns its own `this.props`. ' +
            'Please file an issue.',
          getComponentNameFromFiber(finishedWork) || 'instance',
        );
      }
      if (instance.state !== finishedWork.memoizedState) {
        console.error(
          'Expected %s state to match memoized state before ' +
            'getSnapshotBeforeUpdate. ' +
            'This might either be because of a bug in React, or because ' +
            'a component reassigns its own `this.state`. ' +
            'Please file an issue.',
          getComponentNameFromFiber(finishedWork) || 'instance',
        );
      }
    }
  }
  try {
    const snapshot = instance.getSnapshotBeforeUpdate(
      resolveClassComponentProps(
        finishedWork.type,
        prevProps,
        finishedWork.elementType === finishedWork.type,
      ),
      prevState,
    );
    if (__DEV__) {
      const didWarnSet =
        ((didWarnAboutUndefinedSnapshotBeforeUpdate: any): Set<mixed>);
      if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
        didWarnSet.add(finishedWork.type);
        console.error(
          '%s.getSnapshotBeforeUpdate(): A snapshot value (or null) ' +
            'must be returned. You have returned undefined.',
          getComponentNameFromFiber(finishedWork),
        );
      }
    }
    instance.__reactInternalSnapshotBeforeUpdate = snapshot;
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}

// Capture errors so they don't interrupt unmounting.
export function safelyCallComponentWillUnmount(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
  instance: any,
) {
  instance.props = resolveClassComponentProps(
    current.type,
    current.memoizedProps,
    current.elementType === current.type,
  );
  instance.state = current.memoizedState;
  if (shouldProfile(current)) {
    startLayoutEffectTimer();
    if (__DEV__) {
      callComponentWillUnmountInDEV(current, nearestMountedAncestor, instance);
    } else {
      try {
        instance.componentWillUnmount();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
    recordLayoutEffectDuration(current);
  } else {
    if (__DEV__) {
      callComponentWillUnmountInDEV(current, nearestMountedAncestor, instance);
    } else {
      try {
        instance.componentWillUnmount();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    }
  }
}

function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostHoistable:
      case HostSingleton:
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    // Moved outside to ensure DCE works with this flag
    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance;
    }
    if (typeof ref === 'function') {
      if (shouldProfile(finishedWork)) {
        try {
          startLayoutEffectTimer();
          finishedWork.refCleanup = ref(instanceToUse);
        } finally {
          recordLayoutEffectDuration(finishedWork);
        }
      } else {
        finishedWork.refCleanup = ref(instanceToUse);
      }
    } else {
      if (__DEV__) {
        // TODO: We should move these warnings to happen during the render
        // phase (markRef).
        if (disableStringRefs && typeof ref === 'string') {
          console.error('String refs are no longer supported.');
        } else if (!ref.hasOwnProperty('current')) {
          console.error(
            'Unexpected ref object provided for %s. ' +
              'Use either a ref-setter function or React.createRef().',
            getComponentNameFromFiber(finishedWork),
          );
        }
      }

      // $FlowFixMe[incompatible-use] unable to narrow type to the non-function case
      ref.current = instanceToUse;
    }
  }
}

// Capture errors so they don't interrupt mounting.
export function safelyAttachRef(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  try {
    commitAttachRef(current);
  } catch (error) {
    captureCommitPhaseError(current, nearestMountedAncestor, error);
  }
}

export function safelyDetachRef(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
) {
  const ref = current.ref;
  const refCleanup = current.refCleanup;

  if (ref !== null) {
    if (typeof refCleanup === 'function') {
      try {
        if (shouldProfile(current)) {
          try {
            startLayoutEffectTimer();
            refCleanup();
          } finally {
            recordLayoutEffectDuration(current);
          }
        } else {
          refCleanup();
        }
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      } finally {
        // `refCleanup` has been called. Nullify all references to it to prevent double invocation.
        current.refCleanup = null;
        const finishedWork = current.alternate;
        if (finishedWork != null) {
          finishedWork.refCleanup = null;
        }
      }
    } else if (typeof ref === 'function') {
      try {
        if (shouldProfile(current)) {
          try {
            startLayoutEffectTimer();
            ref(null);
          } finally {
            recordLayoutEffectDuration(current);
          }
        } else {
          ref(null);
        }
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      }
    } else {
      // $FlowFixMe[incompatible-use] unable to narrow type to RefObject
      ref.current = null;
    }
  }
}

export function safelyCallDestroy(
  current: Fiber,
  nearestMountedAncestor: Fiber | null,
  destroy: () => void,
) {
  if (__DEV__) {
    callDestroyInDEV(current, nearestMountedAncestor, destroy);
  } else {
    try {
      destroy();
    } catch (error) {
      captureCommitPhaseError(current, nearestMountedAncestor, error);
    }
  }
}

export function commitProfilerUpdate(
  finishedWork: Fiber,
  current: Fiber | null,
  commitTime: number,
  effectDuration: number,
) {
  if (enableProfilerTimer && getExecutionContext() & CommitContext) {
    try {
      const {onCommit, onRender} = finishedWork.memoizedProps;

      let phase = current === null ? 'mount' : 'update';
      if (enableProfilerNestedUpdatePhase) {
        if (isCurrentUpdateNested()) {
          phase = 'nested-update';
        }
      }

      if (typeof onRender === 'function') {
        onRender(
          finishedWork.memoizedProps.id,
          phase,
          finishedWork.actualDuration,
          finishedWork.treeBaseDuration,
          finishedWork.actualStartTime,
          commitTime,
        );
      }

      if (enableProfilerCommitHooks) {
        if (typeof onCommit === 'function') {
          onCommit(
            finishedWork.memoizedProps.id,
            phase,
            effectDuration,
            commitTime,
          );
        }
      }
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}
