// @flow

// This file was forked from the React GitHub repo:
// https://github.com/facebook/react/blob/master/packages/react-debug-tools/src/ReactDebugHooks.js
// It has been modified slightly though to account for "shared" imports and different lint configs.
// I've also removed some of the Flow types that don't exist in DevTools.
// TODO Remove this fork and use the NPM version of this package once it's released.

import ErrorStackParser from 'error-stack-parser';

type Fiber = any;
type Hook = any;

// HACK: These values are copied from attachRendererFiber
// In the future, the react-debug-hooks package will be published to NPM,
// and be locked to a specific range of react versions
// For now we are just hard-coding the current/latest versions.
const ContextProvider = 10;
const ForwardRef = 11;
const FunctionComponent = 0;
const SimpleMemoComponent = 15;

// Used to track hooks called during a render

type HookLogEntry = {
  primitive: string,
  stackError: Error,
  value: mixed,
};

let hookLog: Array<HookLogEntry> = [];

// Primitives

type BasicStateAction<S> = (S => S) | S;

type Dispatch<A> = A => void;

let primitiveStackCache: null | Map<string, Array<any>> = null;

function getPrimitiveStackCache(): Map<string, Array<any>> {
  // This initializes a cache of all primitive hooks so that the top
  // most stack frames added by calling the primitive hook can be removed.
  if (primitiveStackCache === null) {
    const cache = new Map();
    let readHookLog;
    try {
      // Use all hooks here to add them to the hook log.
      Dispatcher.useContext(({ _currentValue: null }: any));
      Dispatcher.useState(null);
      Dispatcher.useReducer((s, a) => s, null);
      Dispatcher.useRef(null);
      Dispatcher.useLayoutEffect(() => {});
      Dispatcher.useEffect(() => {});
      Dispatcher.useImperativeHandle(undefined, () => null);
      Dispatcher.useCallback(() => {});
      Dispatcher.useMemo(() => null);
      Dispatcher.useDebugValue(null);
    } finally {
      readHookLog = hookLog;
      hookLog = [];
    }
    for (let i = 0; i < readHookLog.length; i++) {
      const hook = readHookLog[i];
      cache.set(hook.primitive, ErrorStackParser.parse(hook.stackError));
    }
    primitiveStackCache = cache;
  }
  return primitiveStackCache;
}

let currentHook: null | Hook = null;
function nextHook(): null | Hook {
  const hook = currentHook;
  if (hook !== null) {
    currentHook = hook.next;
  }
  return hook;
}

function readContext<T>(
  context: any,
  observedBits: void | number | boolean
): T {
  // For now we don't expose readContext usage in the hooks debugging info.
  return context._currentValue;
}

function useContext<T>(context: any, observedBits: void | number | boolean): T {
  hookLog.push({
    primitive: 'Context',
    stackError: new Error(),
    value: context._currentValue,
  });
  return context._currentValue;
}

function useState<S>(
  initialState: (() => S) | S
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = nextHook();
  const state: S =
    hook !== null
      ? hook.memoizedState
      : typeof initialState === 'function'
      ? (initialState: any)()
      : initialState;
  hookLog.push({ primitive: 'State', stackError: new Error(), value: state });
  return [state, (action: BasicStateAction<S>) => {}];
}

function useReducer<S, A>(
  reducer: (S, A) => S,
  initialState: S,
  initialAction: A | void | null
): [S, Dispatch<A>] {
  const hook = nextHook();
  const state = hook !== null ? hook.memoizedState : initialState;
  hookLog.push({
    primitive: 'Reducer',
    stackError: new Error(),
    value: state,
  });
  return [state, (action: A) => {}];
}

function useRef<T>(initialValue: T): { current: T } {
  const hook = nextHook();
  const ref = hook !== null ? hook.memoizedState : { current: initialValue };
  hookLog.push({
    primitive: 'Ref',
    stackError: new Error(),
    value: ref.current,
  });
  return ref;
}

function useLayoutEffect(
  create: () => mixed,
  inputs: Array<mixed> | void | null
): void {
  nextHook();
  hookLog.push({
    primitive: 'LayoutEffect',
    stackError: new Error(),
    value: create,
  });
}

function useEffect(
  create: () => mixed,
  inputs: Array<mixed> | void | null
): void {
  nextHook();
  hookLog.push({ primitive: 'Effect', stackError: new Error(), value: create });
}

function useImperativeHandle<T>(
  ref: { current: T | null } | ((inst: T | null) => mixed) | null | void,
  create: () => T,
  inputs: Array<mixed> | void | null
): void {
  nextHook();
  // We don't actually store the instance anywhere if there is no ref callback
  // and if there is a ref callback it might not store it but if it does we
  // have no way of knowing where. So let's only enable introspection of the
  // ref itself if it is using the object form.
  let instance = undefined;
  if (ref !== null && typeof ref === 'object') {
    instance = ref.current;
  }
  hookLog.push({
    primitive: 'ImperativeHandle',
    stackError: new Error(),
    value: instance,
  });
}

function useCallback<T>(callback: T, inputs: Array<mixed> | void | null): T {
  const hook = nextHook();
  hookLog.push({
    primitive: 'Callback',
    stackError: new Error(),
    value: hook !== null ? hook.memoizedState[0] : callback,
  });
  return callback;
}

function useDebugValue(value: any, formatterFn: ?(value: any) => any) {
  hookLog.push({
    primitive: 'DebugValue',
    stackError: new Error(),
    value: typeof formatterFn === 'function' ? formatterFn(value) : value,
  });
}

function useMemo<T>(
  nextCreate: () => T,
  inputs: Array<mixed> | void | null
): T {
  const hook = nextHook();
  const value = hook !== null ? hook.memoizedState[0] : nextCreate();
  hookLog.push({ primitive: 'Memo', stackError: new Error(), value });
  return value;
}

const Dispatcher = {
  readContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useDebugValue,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
};

// Inspect

type ReactCurrentDispatcher = {
  current: null | typeof Dispatcher,
};

type HooksNode = {
  index: number,
  name: string,
  value: mixed,
  subHooks: Array<HooksNode>,
};
type HooksTree = Array<HooksNode>;

// Don't assume
//
// We can't assume that stack frames are nth steps away from anything.
// E.g. we can't assume that the root call shares all frames with the stack
// of a hook call. A simple way to demonstrate this is wrapping `new Error()`
// in a wrapper constructor like a polyfill. That'll add an extra frame.
// Similar things can happen with the call to the dispatcher. The top frame
// may not be the primitive. Likewise the primitive can have fewer stack frames
// such as when a call to useState got inlined to use dispatcher.useState.
//
// We also can't assume that the last frame of the root call is the same
// frame as the last frame of the hook call because long stack traces can be
// truncated to a stack trace limit.

let mostLikelyAncestorIndex = 0;

function findSharedIndex(hookStack, rootStack, rootIndex) {
  const source = rootStack[rootIndex].source;
  hookSearch: for (let i = 0; i < hookStack.length; i++) {
    if (hookStack[i].source === source) {
      // This looks like a match. Validate that the rest of both stack match up.
      for (
        let a = rootIndex + 1, b = i + 1;
        a < rootStack.length && b < hookStack.length;
        a++, b++
      ) {
        if (hookStack[b].source !== rootStack[a].source) {
          // If not, give up and try a different match.
          continue hookSearch;
        }
      }
      return i;
    }
  }
  return -1;
}

function findCommonAncestorIndex(rootStack, hookStack) {
  let rootIndex = findSharedIndex(
    hookStack,
    rootStack,
    mostLikelyAncestorIndex
  );
  if (rootIndex !== -1) {
    return rootIndex;
  }
  // If the most likely one wasn't a hit, try any other frame to see if it is shared.
  // If that takes more than 5 frames, something probably went wrong.
  for (let i = 0; i < rootStack.length && i < 5; i++) {
    rootIndex = findSharedIndex(hookStack, rootStack, i);
    if (rootIndex !== -1) {
      mostLikelyAncestorIndex = i;
      return rootIndex;
    }
  }
  return -1;
}

function isReactWrapper(functionName, primitiveName) {
  if (!functionName) {
    return false;
  }
  const expectedPrimitiveName = 'use' + primitiveName;
  if (functionName.length < expectedPrimitiveName.length) {
    return false;
  }
  return (
    functionName.lastIndexOf(expectedPrimitiveName) ===
    functionName.length - expectedPrimitiveName.length
  );
}

function findPrimitiveIndex(hookStack, hook) {
  const stackCache = getPrimitiveStackCache();
  const primitiveStack = stackCache.get(hook.primitive);
  if (primitiveStack === undefined) {
    return -1;
  }
  for (let i = 0; i < primitiveStack.length && i < hookStack.length; i++) {
    if (primitiveStack[i].source !== hookStack[i].source) {
      // If the next two frames are functions called `useX` then we assume that they're part of the
      // wrappers that the React packager or other packages adds around the dispatcher.
      if (
        i < hookStack.length - 1 &&
        isReactWrapper(hookStack[i].functionName, hook.primitive)
      ) {
        i++;
      }
      if (
        i < hookStack.length - 1 &&
        isReactWrapper(hookStack[i].functionName, hook.primitive)
      ) {
        i++;
      }
      return i;
    }
  }
  return -1;
}

function parseTrimmedStack(rootStack, hook) {
  // Get the stack trace between the primitive hook function and
  // the root function call. I.e. the stack frames of custom hooks.
  const hookStack = ErrorStackParser.parse(hook.stackError);
  const rootIndex = findCommonAncestorIndex(rootStack, hookStack);
  const primitiveIndex = findPrimitiveIndex(hookStack, hook);
  if (
    rootIndex === -1 ||
    primitiveIndex === -1 ||
    rootIndex - primitiveIndex < 2
  ) {
    // Something went wrong. Give up.
    return null;
  }
  return hookStack.slice(primitiveIndex, rootIndex - 1);
}

function parseCustomHookName(functionName: void | string): string {
  if (!functionName) {
    return '';
  }
  let startIndex = functionName.lastIndexOf('.');
  if (startIndex === -1) {
    startIndex = 0;
  }
  if (functionName.substr(startIndex, 3) === 'use') {
    startIndex += 3;
  }
  return functionName.substr(startIndex);
}

function buildTree(rootStack, readHookLog): HooksTree {
  const rootChildren = [];
  let prevStack = null;
  let levelChildren = rootChildren;
  let index = 0;
  const stackOfChildren = [];
  for (let i = 0; i < readHookLog.length; i++) {
    const hook = readHookLog[i];
    const stack = parseTrimmedStack(rootStack, hook);
    if (stack !== null) {
      // Note: The indices 0 <= n < length-1 will contain the names.
      // The indices 1 <= n < length will contain the source locations.
      // That's why we get the name from n - 1 and don't check the source
      // of index 0.
      let commonSteps = 0;
      if (prevStack !== null) {
        // Compare the current level's stack to the new stack.
        while (commonSteps < stack.length && commonSteps < prevStack.length) {
          const stackSource = stack[stack.length - commonSteps - 1].source;
          const prevSource =
            prevStack[prevStack.length - commonSteps - 1].source;
          if (stackSource !== prevSource) {
            break;
          }
          commonSteps++;
        }
        // Pop back the stack as many steps as were not common.
        for (let j = prevStack.length - 1; j > commonSteps; j--) {
          levelChildren = stackOfChildren.pop();
        }
      }
      // The remaining part of the new stack are custom hooks. Push them
      // to the tree.
      for (let j = stack.length - commonSteps - 1; j >= 1; j--) {
        const children = [];
        levelChildren.push({
          name: parseCustomHookName(stack[j - 1].functionName),
          value: undefined,
          index: -1,
          subHooks: children,
        });
        stackOfChildren.push(levelChildren);
        levelChildren = children;
      }
      prevStack = stack;
    }
    levelChildren.push({
      name: hook.primitive,
      value: hook.value,
      index: hook.primitive === 'DebugValue' ? -1 : index++,
      subHooks: [],
    });
  }

  // Associate custom hook values (useDebugValue() hook entries) with the correct hooks.
  processDebugValues(rootChildren, null);

  return rootChildren;
}

// Custom hooks support user-configurable labels (via the useDebugValue() hook).
// That hook adds the user-provided values to the hooks tree.
// This method removes those values (so they don't appear in DevTools),
// and bubbles them up to the "value" attribute of their parent custom hook.
function processDebugValues(
  hooksTree: HooksTree,
  parentHooksNode: HooksNode | null
): void {
  const debugValueHooksNodes: Array<HooksNode> = [];

  for (let i = 0; i < hooksTree.length; i++) {
    const hooksNode = hooksTree[i];
    if (hooksNode.name === 'DebugValue' && hooksNode.subHooks.length === 0) {
      hooksTree.splice(i, 1);
      i--;
      debugValueHooksNodes.push(hooksNode);
    } else {
      processDebugValues(hooksNode.subHooks, hooksNode);
    }
  }

  // Bubble debug value labels to their parent custom hook.
  // If there is no parent hook, just ignore them.
  // (We may warn about this in the future.)
  if (parentHooksNode !== null) {
    if (debugValueHooksNodes.length === 1) {
      parentHooksNode.value = debugValueHooksNodes[0].value;
    } else if (debugValueHooksNodes.length > 1) {
      parentHooksNode.value = debugValueHooksNodes.map(({ value }) => value);
    }
  }
}

export function inspectHooks<Props>(
  renderFunction: Props => React$Node,
  props: Props,
  currentDispatcher: ReactCurrentDispatcher
): HooksTree {
  const previousDispatcher = currentDispatcher.current;
  let readHookLog;
  currentDispatcher.current = Dispatcher;
  let ancestorStackError;
  try {
    ancestorStackError = new Error();
    renderFunction(props);
  } finally {
    readHookLog = hookLog;
    hookLog = [];
    currentDispatcher.current = previousDispatcher;
  }
  const rootStack = ErrorStackParser.parse(ancestorStackError);
  return buildTree(rootStack, readHookLog);
}

function setupContexts(contextMap: Map<any, any>, fiber: Fiber) {
  let current = fiber;
  while (current) {
    if (current.tag === ContextProvider) {
      const providerType: any = current.type;
      const context: any = providerType._context;
      if (!contextMap.has(context)) {
        // Store the current value that we're going to restore later.
        contextMap.set(context, context._currentValue);
        // Set the inner most provider value on the context.
        context._currentValue = current.memoizedProps.value;
      }
    }
    current = current.return;
  }
}

function restoreContexts(contextMap: Map<any, any>) {
  contextMap.forEach((value, context) => (context._currentValue = value));
}

function inspectHooksOfForwardRef<Props, Ref>(
  renderFunction: (Props, Ref) => React$Node,
  props: Props,
  ref: Ref,
  currentDispatcher: ReactCurrentDispatcher
): HooksTree {
  const previousDispatcher = currentDispatcher.current;
  let readHookLog;
  currentDispatcher.current = Dispatcher;
  let ancestorStackError;
  try {
    ancestorStackError = new Error();
    renderFunction(props, ref);
  } finally {
    readHookLog = hookLog;
    hookLog = [];
    currentDispatcher.current = previousDispatcher;
  }
  const rootStack = ErrorStackParser.parse(ancestorStackError);
  return buildTree(rootStack, readHookLog);
}

function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = Object.assign({}, baseProps);
    const defaultProps = Component.defaultProps;
    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }
    return props;
  }
  return baseProps;
}

export function inspectHooksOfFiber(
  fiber: Fiber,
  currentDispatcher: ReactCurrentDispatcher
) {
  if (
    fiber.tag !== FunctionComponent &&
    fiber.tag !== SimpleMemoComponent &&
    fiber.tag !== ForwardRef
  ) {
    throw new Error(
      'Unknown Fiber. Needs to be a function component to inspect hooks.'
    );
  }
  // Warm up the cache so that it doesn't consume the currentHook.
  getPrimitiveStackCache();
  const type = fiber.type;
  let props = fiber.memoizedProps;
  if (type !== fiber.elementType) {
    props = resolveDefaultProps(type, props);
  }
  // Set up the current hook so that we can step through and read the
  // current state from them.
  currentHook = (fiber.memoizedState: Hook);
  const contextMap = new Map();
  try {
    setupContexts(contextMap, fiber);
    if (fiber.tag === ForwardRef) {
      return inspectHooksOfForwardRef(
        type.render,
        props,
        fiber.ref,
        currentDispatcher
      );
    }
    return inspectHooks(type, props, currentDispatcher);
  } finally {
    currentHook = null;
    restoreContexts(contextMap);
  }
}
