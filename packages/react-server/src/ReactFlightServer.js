/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  Destination,
  Chunk,
  BundlerConfig,
  ModuleMetaData,
  ModuleReference,
  ModuleKey,
} from './ReactFlightServerConfig';
import type {ContextSnapshot} from './ReactFlightNewContext';
import type {ThenableState} from './ReactFlightThenable';
import type {
  ReactProviderType,
  ServerContextJSONValue,
  Wakeable,
  Thenable,
  PendingThenable,
  FulfilledThenable,
  RejectedThenable,
} from 'shared/ReactTypes';
import type {LazyComponent} from 'react/src/ReactLazy';

import {
  scheduleWork,
  beginWriting,
  writeChunkAndReturn,
  completeWriting,
  flushBuffered,
  close,
  closeWithError,
  processModelChunk,
  processModuleChunk,
  processProviderChunk,
  processSymbolChunk,
  processErrorChunkProd,
  processErrorChunkDev,
  processReferenceChunk,
  resolveModuleMetaData,
  getModuleKey,
  isModuleReference,
  supportsRequestStorage,
  requestStorage,
} from './ReactFlightServerConfig';

import {
  HooksDispatcher,
  prepareToUseHooksForRequest,
  prepareToUseHooksForComponent,
  getThenableStateAfterSuspending,
  resetHooksForRequest,
} from './ReactFlightHooks';
import {
  DefaultCacheDispatcher,
  getCurrentCache,
  setCurrentCache,
} from './ReactFlightCache';
import {
  pushProvider,
  popProvider,
  switchContext,
  getActiveContext,
  rootContextSnapshot,
} from './ReactFlightNewContext';

import {
  REACT_ELEMENT_TYPE,
  REACT_FORWARD_REF_TYPE,
  REACT_FRAGMENT_TYPE,
  REACT_LAZY_TYPE,
  REACT_MEMO_TYPE,
  REACT_PROVIDER_TYPE,
  REACT_SUSPENSE_TYPE,
  REACT_SUSPENSE_LIST_TYPE,
} from 'shared/ReactSymbols';

import {getOrCreateServerContext} from 'shared/ReactServerContextRegistry';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import isArray from 'shared/isArray';
import {SuspenseException, getSuspendedThenable} from './ReactFlightThenable';

type ReactJSONValue =
  | string
  | boolean
  | number
  | null
  | $ReadOnlyArray<ReactJSONValue>
  | ReactModelObject;

export type ReactModel =
  | React$Element<any>
  | LazyComponent<any, any>
  | string
  | boolean
  | number
  | symbol
  | null
  | Iterable<ReactModel>
  | ReactModelObject;

type ReactModelObject = {+[key: string]: ReactModel};

const PENDING = 0;
const COMPLETED = 1;
const ABORTED = 3;
const ERRORED = 4;

type Task = {
  id: number,
  status: 0 | 1 | 3 | 4,
  model: ReactModel,
  ping: () => void,
  context: ContextSnapshot,
  thenableState: ThenableState | null,
};

export type Request = {
  status: 0 | 1 | 2,
  fatalError: mixed,
  destination: null | Destination,
  bundlerConfig: BundlerConfig,
  cache: Map<Function, mixed>,
  nextChunkId: number,
  pendingChunks: number,
  abortableTasks: Set<Task>,
  pingedTasks: Array<Task>,
  completedModuleChunks: Array<Chunk>,
  completedJSONChunks: Array<Chunk>,
  completedErrorChunks: Array<Chunk>,
  writtenSymbols: Map<symbol, number>,
  writtenModules: Map<ModuleKey, number>,
  writtenProviders: Map<string, number>,
  identifierPrefix: string,
  identifierCount: number,
  onError: (error: mixed) => ?string,
  toJSON: (key: string, value: ReactModel) => ReactJSONValue,
};

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
const ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;

function defaultErrorHandler(error: mixed) {
  console['error'](error);
  // Don't transform to our wrapper
}

const OPEN = 0;
const CLOSING = 1;
const CLOSED = 2;

export function createRequest(
  model: ReactModel,
  bundlerConfig: BundlerConfig,
  onError: void | ((error: mixed) => ?string),
  context?: Array<[string, ServerContextJSONValue]>,
  identifierPrefix?: string,
): Request {
  if (
    ReactCurrentCache.current !== null &&
    ReactCurrentCache.current !== DefaultCacheDispatcher
  ) {
    throw new Error(
      'Currently React only supports one RSC renderer at a time.',
    );
  }
  ReactCurrentCache.current = DefaultCacheDispatcher;

  const abortSet: Set<Task> = new Set();
  const pingedTasks = [];
  const request = {
    status: OPEN,
    fatalError: null,
    destination: null,
    bundlerConfig,
    cache: new Map(),
    nextChunkId: 0,
    pendingChunks: 0,
    abortableTasks: abortSet,
    pingedTasks: pingedTasks,
    completedModuleChunks: ([]: Array<Chunk>),
    completedJSONChunks: ([]: Array<Chunk>),
    completedErrorChunks: ([]: Array<Chunk>),
    writtenSymbols: new Map(),
    writtenModules: new Map(),
    writtenProviders: new Map(),
    identifierPrefix: identifierPrefix || '',
    identifierCount: 1,
    onError: onError === undefined ? defaultErrorHandler : onError,
    // $FlowFixMe[missing-this-annot]
    toJSON: function(key: string, value: ReactModel): ReactJSONValue {
      return resolveModelToJSON(request, this, key, value);
    },
  };
  request.pendingChunks++;
  const rootContext = createRootContext(context);
  const rootTask = createTask(request, model, rootContext, abortSet);
  pingedTasks.push(rootTask);
  return request;
}

function createRootContext(
  reqContext?: Array<[string, ServerContextJSONValue]>,
) {
  return importServerContexts(reqContext);
}

const POP = {};

// Used for DEV messages to keep track of which parent rendered some props,
// in case they error.
const jsxPropsParents: WeakMap<any, any> = new WeakMap();
const jsxChildrenParents: WeakMap<any, any> = new WeakMap();

function readThenable<T>(thenable: Thenable<T>): T {
  if (thenable.status === 'fulfilled') {
    return thenable.value;
  } else if (thenable.status === 'rejected') {
    throw thenable.reason;
  }
  throw thenable;
}

function createLazyWrapperAroundWakeable(wakeable: Wakeable) {
  // This is a temporary fork of the `use` implementation until we accept
  // promises everywhere.
  const thenable: Thenable<mixed> = (wakeable: any);
  switch (thenable.status) {
    case 'fulfilled':
    case 'rejected':
      break;
    default: {
      if (typeof thenable.status === 'string') {
        // Only instrument the thenable if the status if not defined. If
        // it's defined, but an unknown value, assume it's been instrumented by
        // some custom userspace implementation. We treat it as "pending".
        break;
      }
      const pendingThenable: PendingThenable<mixed> = (thenable: any);
      pendingThenable.status = 'pending';
      pendingThenable.then(
        fulfilledValue => {
          if (thenable.status === 'pending') {
            const fulfilledThenable: FulfilledThenable<mixed> = (thenable: any);
            fulfilledThenable.status = 'fulfilled';
            fulfilledThenable.value = fulfilledValue;
          }
        },
        (error: mixed) => {
          if (thenable.status === 'pending') {
            const rejectedThenable: RejectedThenable<mixed> = (thenable: any);
            rejectedThenable.status = 'rejected';
            rejectedThenable.reason = error;
          }
        },
      );
      break;
    }
  }
  const lazyType: LazyComponent<any, Thenable<any>> = {
    $$typeof: REACT_LAZY_TYPE,
    _payload: thenable,
    _init: readThenable,
  };
  return lazyType;
}

function attemptResolveElement(
  type: any,
  key: null | React$Key,
  ref: mixed,
  props: any,
  prevThenableState: ThenableState | null,
): ReactModel {
  if (ref !== null && ref !== undefined) {
    // When the ref moves to the regular props object this will implicitly
    // throw for functions. We could probably relax it to a DEV warning for other
    // cases.
    throw new Error(
      'Refs cannot be used in Server Components, nor passed to Client Components.',
    );
  }
  if (__DEV__) {
    jsxPropsParents.set(props, type);
    if (typeof props.children === 'object' && props.children !== null) {
      jsxChildrenParents.set(props.children, type);
    }
  }
  if (typeof type === 'function') {
    if (isModuleReference(type)) {
      // This is a reference to a Client Component.
      return [REACT_ELEMENT_TYPE, type, key, props];
    }
    // This is a server-side component.
    prepareToUseHooksForComponent(prevThenableState);
    const result = type(props);
    if (
      typeof result === 'object' &&
      result !== null &&
      typeof result.then === 'function'
    ) {
      return createLazyWrapperAroundWakeable(result);
    }
    return result;
  } else if (typeof type === 'string') {
    // This is a host element. E.g. HTML.
    return [REACT_ELEMENT_TYPE, type, key, props];
  } else if (typeof type === 'symbol') {
    if (type === REACT_FRAGMENT_TYPE) {
      // For key-less fragments, we add a small optimization to avoid serializing
      // it as a wrapper.
      // TODO: If a key is specified, we should propagate its key to any children.
      // Same as if a Server Component has a key.
      return props.children;
    }
    // This might be a built-in React component. We'll let the client decide.
    // Any built-in works as long as its props are serializable.
    return [REACT_ELEMENT_TYPE, type, key, props];
  } else if (type != null && typeof type === 'object') {
    if (isModuleReference(type)) {
      // This is a reference to a Client Component.
      return [REACT_ELEMENT_TYPE, type, key, props];
    }
    switch (type.$$typeof) {
      case REACT_LAZY_TYPE: {
        const payload = type._payload;
        const init = type._init;
        const wrappedType = init(payload);
        return attemptResolveElement(
          wrappedType,
          key,
          ref,
          props,
          prevThenableState,
        );
      }
      case REACT_FORWARD_REF_TYPE: {
        const render = type.render;
        prepareToUseHooksForComponent(prevThenableState);
        return render(props, undefined);
      }
      case REACT_MEMO_TYPE: {
        return attemptResolveElement(
          type.type,
          key,
          ref,
          props,
          prevThenableState,
        );
      }
      case REACT_PROVIDER_TYPE: {
        pushProvider(type._context, props.value);
        if (__DEV__) {
          const extraKeys = Object.keys(props).filter(value => {
            if (value === 'children' || value === 'value') {
              return false;
            }
            return true;
          });
          if (extraKeys.length !== 0) {
            console.error(
              'ServerContext can only have a value prop and children. Found: %s',
              JSON.stringify(extraKeys),
            );
          }
        }
        return [
          REACT_ELEMENT_TYPE,
          type,
          key,
          // Rely on __popProvider being serialized last to pop the provider.
          {value: props.value, children: props.children, __pop: POP},
        ];
      }
    }
  }
  throw new Error(
    `Unsupported Server Component type: ${describeValueForErrorMessage(type)}`,
  );
}

function pingTask(request: Request, task: Task): void {
  const pingedTasks = request.pingedTasks;
  pingedTasks.push(task);
  if (pingedTasks.length === 1) {
    scheduleWork(() => performWork(request));
  }
}

function createTask(
  request: Request,
  model: ReactModel,
  context: ContextSnapshot,
  abortSet: Set<Task>,
): Task {
  const id = request.nextChunkId++;
  const task = {
    id,
    status: PENDING,
    model,
    context,
    ping: () => pingTask(request, task),
    thenableState: null,
  };
  abortSet.add(task);
  return task;
}

function serializeByValueID(id: number): string {
  return '$' + id.toString(16);
}

function serializeByRefID(id: number): string {
  return '@' + id.toString(16);
}

function serializeModuleReference(
  request: Request,
  parent: {+[key: string | number]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  moduleReference: ModuleReference<any>,
): string {
  const moduleKey: ModuleKey = getModuleKey(moduleReference);
  const writtenModules = request.writtenModules;
  const existingId = writtenModules.get(moduleKey);
  if (existingId !== undefined) {
    if (parent[0] === REACT_ELEMENT_TYPE && key === '1') {
      // If we're encoding the "type" of an element, we can refer
      // to that by a lazy reference instead of directly since React
      // knows how to deal with lazy values. This lets us suspend
      // on this component rather than its parent until the code has
      // loaded.
      return serializeByRefID(existingId);
    }
    return serializeByValueID(existingId);
  }
  try {
    const moduleMetaData: ModuleMetaData = resolveModuleMetaData(
      request.bundlerConfig,
      moduleReference,
    );
    request.pendingChunks++;
    const moduleId = request.nextChunkId++;
    emitModuleChunk(request, moduleId, moduleMetaData);
    writtenModules.set(moduleKey, moduleId);
    if (parent[0] === REACT_ELEMENT_TYPE && key === '1') {
      // If we're encoding the "type" of an element, we can refer
      // to that by a lazy reference instead of directly since React
      // knows how to deal with lazy values. This lets us suspend
      // on this component rather than its parent until the code has
      // loaded.
      return serializeByRefID(moduleId);
    }
    return serializeByValueID(moduleId);
  } catch (x) {
    request.pendingChunks++;
    const errorId = request.nextChunkId++;
    const digest = logRecoverableError(request, x);
    if (__DEV__) {
      const {message, stack} = getErrorMessageAndStackDev(x);
      emitErrorChunkDev(request, errorId, digest, message, stack);
    } else {
      emitErrorChunkProd(request, errorId, digest);
    }
    return serializeByValueID(errorId);
  }
}

function escapeStringValue(value: string): string {
  if (value[0] === '$' || value[0] === '@') {
    // We need to escape $ or @ prefixed strings since we use those to encode
    // references to IDs and as special symbol values.
    return '$' + value;
  } else {
    return value;
  }
}

function isObjectPrototype(object: any): boolean {
  if (!object) {
    return false;
  }
  const ObjectPrototype = Object.prototype;
  if (object === ObjectPrototype) {
    return true;
  }
  // It might be an object from a different Realm which is
  // still just a plain simple object.
  if (Object.getPrototypeOf(object)) {
    return false;
  }
  const names = Object.getOwnPropertyNames(object);
  for (let i = 0; i < names.length; i++) {
    if (!(names[i] in ObjectPrototype)) {
      return false;
    }
  }
  return true;
}

function isSimpleObject(object: any): boolean {
  if (!isObjectPrototype(Object.getPrototypeOf(object))) {
    return false;
  }
  const names = Object.getOwnPropertyNames(object);
  for (let i = 0; i < names.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(object, names[i]);
    if (!descriptor) {
      return false;
    }
    if (!descriptor.enumerable) {
      if (
        (names[i] === 'key' || names[i] === 'ref') &&
        typeof descriptor.get === 'function'
      ) {
        // React adds key and ref getters to props objects to issue warnings.
        // Those getters will not be transferred to the client, but that's ok,
        // so we'll special case them.
        continue;
      }
      return false;
    }
  }
  return true;
}

function objectName(object: mixed): string {
  // $FlowFixMe[method-unbinding]
  const name = Object.prototype.toString.call(object);
  return name.replace(/^\[object (.*)\]$/, function(m, p0) {
    return p0;
  });
}

function describeKeyForErrorMessage(key: string): string {
  const encodedKey = JSON.stringify(key);
  return '"' + key + '"' === encodedKey ? key : encodedKey;
}

function describeValueForErrorMessage(value: ReactModel): string {
  switch (typeof value) {
    case 'string': {
      return JSON.stringify(
        value.length <= 10 ? value : value.substr(0, 10) + '...',
      );
    }
    case 'object': {
      if (isArray(value)) {
        return '[...]';
      }
      const name = objectName(value);
      if (name === 'Object') {
        return '{...}';
      }
      return name;
    }
    case 'function':
      return 'function';
    default:
      // eslint-disable-next-line react-internal/safe-string-coercion
      return String(value);
  }
}

function describeElementType(type: any): string {
  if (typeof type === 'string') {
    return type;
  }
  switch (type) {
    case REACT_SUSPENSE_TYPE:
      return 'Suspense';
    case REACT_SUSPENSE_LIST_TYPE:
      return 'SuspenseList';
  }
  if (typeof type === 'object') {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE:
        return describeElementType(type.render);
      case REACT_MEMO_TYPE:
        return describeElementType(type.type);
      case REACT_LAZY_TYPE: {
        const lazyComponent: LazyComponent<any, any> = (type: any);
        const payload = lazyComponent._payload;
        const init = lazyComponent._init;
        try {
          // Lazy may contain any component type so we recursively resolve it.
          return describeElementType(init(payload));
        } catch (x) {}
      }
    }
  }
  return '';
}

function describeObjectForErrorMessage(
  objectOrArray:
    | {+[key: string | number]: ReactModel, ...}
    | $ReadOnlyArray<ReactModel>,
  expandedName?: string,
): string {
  const objKind = objectName(objectOrArray);
  if (objKind !== 'Object' && objKind !== 'Array') {
    return objKind;
  }
  let str = '';
  let start = -1;
  let length = 0;
  if (isArray(objectOrArray)) {
    if (__DEV__ && jsxChildrenParents.has(objectOrArray)) {
      // Print JSX Children
      const type = jsxChildrenParents.get(objectOrArray);
      str = '<' + describeElementType(type) + '>';
      const array: $ReadOnlyArray<ReactModel> = objectOrArray;
      for (let i = 0; i < array.length; i++) {
        const value = array[i];
        let substr;
        if (typeof value === 'string') {
          substr = value;
        } else if (typeof value === 'object' && value !== null) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          substr = '{' + describeObjectForErrorMessage(value) + '}';
        } else {
          substr = '{' + describeValueForErrorMessage(value) + '}';
        }
        if ('' + i === expandedName) {
          start = str.length;
          length = substr.length;
          str += substr;
        } else if (substr.length < 15 && str.length + substr.length < 40) {
          str += substr;
        } else {
          str += '{...}';
        }
      }
      str += '</' + describeElementType(type) + '>';
    } else {
      // Print Array
      str = '[';
      const array: $ReadOnlyArray<ReactModel> = objectOrArray;
      for (let i = 0; i < array.length; i++) {
        if (i > 0) {
          str += ', ';
        }
        const value = array[i];
        let substr;
        if (typeof value === 'object' && value !== null) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          substr = describeObjectForErrorMessage(value);
        } else {
          substr = describeValueForErrorMessage(value);
        }
        if ('' + i === expandedName) {
          start = str.length;
          length = substr.length;
          str += substr;
        } else if (substr.length < 10 && str.length + substr.length < 40) {
          str += substr;
        } else {
          str += '...';
        }
      }
      str += ']';
    }
  } else {
    if (objectOrArray.$$typeof === REACT_ELEMENT_TYPE) {
      str = '<' + describeElementType(objectOrArray.type) + '/>';
    } else if (__DEV__ && jsxPropsParents.has(objectOrArray)) {
      // Print JSX
      const type = jsxPropsParents.get(objectOrArray);
      str = '<' + (describeElementType(type) || '...');
      const object: {+[key: string | number]: ReactModel, ...} = objectOrArray;
      const names = Object.keys(object);
      for (let i = 0; i < names.length; i++) {
        str += ' ';
        const name = names[i];
        str += describeKeyForErrorMessage(name) + '=';
        const value = object[name];
        let substr;
        if (
          name === expandedName &&
          typeof value === 'object' &&
          value !== null
        ) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          substr = describeObjectForErrorMessage(value);
        } else {
          substr = describeValueForErrorMessage(value);
        }
        if (typeof value !== 'string') {
          substr = '{' + substr + '}';
        }
        if (name === expandedName) {
          start = str.length;
          length = substr.length;
          str += substr;
        } else if (substr.length < 10 && str.length + substr.length < 40) {
          str += substr;
        } else {
          str += '...';
        }
      }
      str += '>';
    } else {
      // Print Object
      str = '{';
      const object: {+[key: string | number]: ReactModel, ...} = objectOrArray;
      const names = Object.keys(object);
      for (let i = 0; i < names.length; i++) {
        if (i > 0) {
          str += ', ';
        }
        const name = names[i];
        str += describeKeyForErrorMessage(name) + ': ';
        const value = object[name];
        let substr;
        if (typeof value === 'object' && value !== null) {
          // $FlowFixMe[incompatible-call] found when upgrading Flow
          substr = describeObjectForErrorMessage(value);
        } else {
          substr = describeValueForErrorMessage(value);
        }
        if (name === expandedName) {
          start = str.length;
          length = substr.length;
          str += substr;
        } else if (substr.length < 10 && str.length + substr.length < 40) {
          str += substr;
        } else {
          str += '...';
        }
      }
      str += '}';
    }
  }
  if (expandedName === undefined) {
    return str;
  }
  if (start > -1 && length > 0) {
    const highlight = ' '.repeat(start) + '^'.repeat(length);
    return '\n  ' + str + '\n  ' + highlight;
  }
  return '\n  ' + str;
}

let insideContextProps = null;
let isInsideContextValue = false;

export function resolveModelToJSON(
  request: Request,
  parent: {+[key: string | number]: ReactModel} | $ReadOnlyArray<ReactModel>,
  key: string,
  value: ReactModel,
): ReactJSONValue {
  if (__DEV__) {
    // $FlowFixMe
    const originalValue = parent[key];
    if (typeof originalValue === 'object' && originalValue !== value) {
      if (objectName(originalValue) !== 'Object') {
        const jsxParentType = jsxChildrenParents.get(parent);
        if (typeof jsxParentType === 'string') {
          console.error(
            '%s objects cannot be rendered as text children. Try formatting it using toString().%s',
            objectName(originalValue),
            describeObjectForErrorMessage(parent, key),
          );
        } else {
          console.error(
            'Only plain objects can be passed to Client Components from Server Components. ' +
              '%s objects are not supported.%s',
            objectName(originalValue),
            describeObjectForErrorMessage(parent, key),
          );
        }
      } else {
        console.error(
          'Only plain objects can be passed to Client Components from Server Components. ' +
            'Objects with toJSON methods are not supported. Convert it manually ' +
            'to a simple value before passing it to props.%s',
          describeObjectForErrorMessage(parent, key),
        );
      }
    }
  }

  // Special Symbols
  switch (value) {
    case REACT_ELEMENT_TYPE:
      return '$';
  }

  if (__DEV__) {
    if (
      parent[0] === REACT_ELEMENT_TYPE &&
      parent[1] &&
      parent[1].$$typeof === REACT_PROVIDER_TYPE &&
      key === '3'
    ) {
      insideContextProps = value;
    } else if (insideContextProps === parent && key === 'value') {
      isInsideContextValue = true;
    } else if (insideContextProps === parent && key === 'children') {
      isInsideContextValue = false;
    }
  }

  // Resolve Server Components.
  while (
    typeof value === 'object' &&
    value !== null &&
    ((value: any).$$typeof === REACT_ELEMENT_TYPE ||
      (value: any).$$typeof === REACT_LAZY_TYPE)
  ) {
    if (__DEV__) {
      if (isInsideContextValue) {
        console.error('React elements are not allowed in ServerContext');
      }
    }

    try {
      switch ((value: any).$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // TODO: Concatenate keys of parents onto children.
          const element: React$Element<any> = (value: any);
          // Attempt to render the Server Component.
          value = attemptResolveElement(
            element.type,
            element.key,
            element.ref,
            element.props,
            null,
          );
          break;
        }
        case REACT_LAZY_TYPE: {
          const payload = (value: any)._payload;
          const init = (value: any)._init;
          value = init(payload);
          break;
        }
      }
    } catch (thrownValue) {
      const x =
        thrownValue === SuspenseException
          ? // This is a special type of exception used for Suspense. For historical
            // reasons, the rest of the Suspense implementation expects the thrown
            // value to be a thenable, because before `use` existed that was the
            // (unstable) API for suspending. This implementation detail can change
            // later, once we deprecate the old API in favor of `use`.
            getSuspendedThenable()
          : thrownValue;
      // $FlowFixMe[method-unbinding]
      if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
        // Something suspended, we'll need to create a new task and resolve it later.
        request.pendingChunks++;
        const newTask = createTask(
          request,
          value,
          getActiveContext(),
          request.abortableTasks,
        );
        const ping = newTask.ping;
        x.then(ping, ping);
        newTask.thenableState = getThenableStateAfterSuspending();
        return serializeByRefID(newTask.id);
      } else {
        // Something errored. We'll still send everything we have up until this point.
        // We'll replace this element with a lazy reference that throws on the client
        // once it gets rendered.
        request.pendingChunks++;
        const errorId = request.nextChunkId++;
        const digest = logRecoverableError(request, x);
        if (__DEV__) {
          const {message, stack} = getErrorMessageAndStackDev(x);
          emitErrorChunkDev(request, errorId, digest, message, stack);
        } else {
          emitErrorChunkProd(request, errorId, digest);
        }
        return serializeByRefID(errorId);
      }
    }
  }

  if (value === null) {
    return null;
  }

  if (typeof value === 'object') {
    if (isModuleReference(value)) {
      return serializeModuleReference(request, parent, key, (value: any));
    } else if ((value: any).$$typeof === REACT_PROVIDER_TYPE) {
      const providerKey = ((value: any): ReactProviderType<any>)._context
        ._globalName;
      const writtenProviders = request.writtenProviders;
      let providerId = writtenProviders.get(key);
      if (providerId === undefined) {
        request.pendingChunks++;
        providerId = request.nextChunkId++;
        writtenProviders.set(providerKey, providerId);
        emitProviderChunk(request, providerId, providerKey);
      }
      return serializeByValueID(providerId);
    } else if (value === POP) {
      popProvider();
      if (__DEV__) {
        insideContextProps = null;
        isInsideContextValue = false;
      }
      return (undefined: any);
    }

    if (__DEV__) {
      if (value !== null && !isArray(value)) {
        // Verify that this is a simple plain object.
        if (objectName(value) !== 'Object') {
          console.error(
            'Only plain objects can be passed to Client Components from Server Components. ' +
              '%s objects are not supported.%s',
            objectName(value),
            describeObjectForErrorMessage(parent, key),
          );
        } else if (!isSimpleObject(value)) {
          console.error(
            'Only plain objects can be passed to Client Components from Server Components. ' +
              'Classes or other objects with methods are not supported.%s',
            describeObjectForErrorMessage(parent, key),
          );
        } else if (Object.getOwnPropertySymbols) {
          const symbols = Object.getOwnPropertySymbols(value);
          if (symbols.length > 0) {
            console.error(
              'Only plain objects can be passed to Client Components from Server Components. ' +
                'Objects with symbol properties like %s are not supported.%s',
              symbols[0].description,
              describeObjectForErrorMessage(parent, key),
            );
          }
        }
      }
    }

    // $FlowFixMe
    return value;
  }

  if (typeof value === 'string') {
    return escapeStringValue(value);
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'undefined'
  ) {
    return value;
  }

  if (typeof value === 'function') {
    if (isModuleReference(value)) {
      return serializeModuleReference(request, parent, key, (value: any));
    }
    if (/^on[A-Z]/.test(key)) {
      throw new Error(
        'Event handlers cannot be passed to Client Component props.' +
          describeObjectForErrorMessage(parent, key) +
          '\nIf you need interactivity, consider converting part of this to a Client Component.',
      );
    } else {
      throw new Error(
        'Functions cannot be passed directly to Client Components ' +
          "because they're not serializable." +
          describeObjectForErrorMessage(parent, key),
      );
    }
  }

  if (typeof value === 'symbol') {
    const writtenSymbols = request.writtenSymbols;
    const existingId = writtenSymbols.get(value);
    if (existingId !== undefined) {
      return serializeByValueID(existingId);
    }
    // $FlowFixMe `description` might be undefined
    const name: string = value.description;

    if (Symbol.for(name) !== value) {
      throw new Error(
        'Only global symbols received from Symbol.for(...) can be passed to Client Components. ' +
          `The symbol Symbol.for(${
            // $FlowFixMe `description` might be undefined
            value.description
          }) cannot be found among global symbols.` +
          describeObjectForErrorMessage(parent, key),
      );
    }

    request.pendingChunks++;
    const symbolId = request.nextChunkId++;
    emitSymbolChunk(request, symbolId, name);
    writtenSymbols.set(value, symbolId);
    return serializeByValueID(symbolId);
  }

  if (typeof value === 'bigint') {
    throw new Error(
      `BigInt (${value}) is not yet supported in Client Component props.` +
        describeObjectForErrorMessage(parent, key),
    );
  }

  throw new Error(
    `Type ${typeof value} is not supported in Client Component props.` +
      describeObjectForErrorMessage(parent, key),
  );
}

function logRecoverableError(request: Request, error: mixed): string {
  const onError = request.onError;
  const errorDigest = onError(error);
  if (errorDigest != null && typeof errorDigest !== 'string') {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      `onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "${typeof errorDigest}" instead`,
    );
  }
  return errorDigest || '';
}

function getErrorMessageAndStackDev(
  error: mixed,
): {message: string, stack: string} {
  if (__DEV__) {
    let message;
    let stack = '';
    try {
      if (error instanceof Error) {
        // eslint-disable-next-line react-internal/safe-string-coercion
        message = String(error.message);
        // eslint-disable-next-line react-internal/safe-string-coercion
        stack = String(error.stack);
      } else {
        message = 'Error: ' + (error: any);
      }
    } catch (x) {
      message = 'An error occurred but serializing the error message failed.';
    }
    return {
      message,
      stack,
    };
  } else {
    // These errors should never make it into a build so we don't need to encode them in codes.json
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'getErrorMessageAndStackDev should never be called from production mode. This is a bug in React.',
    );
  }
}

function fatalError(request: Request, error: mixed): void {
  // This is called outside error handling code such as if an error happens in React internals.
  if (request.destination !== null) {
    request.status = CLOSED;
    closeWithError(request.destination, error);
  } else {
    request.status = CLOSING;
    request.fatalError = error;
  }
}

function emitErrorChunkProd(
  request: Request,
  id: number,
  digest: string,
): void {
  const processedChunk = processErrorChunkProd(request, id, digest);
  request.completedErrorChunks.push(processedChunk);
}

function emitErrorChunkDev(
  request: Request,
  id: number,
  digest: string,
  message: string,
  stack: string,
): void {
  const processedChunk = processErrorChunkDev(
    request,
    id,
    digest,
    message,
    stack,
  );
  request.completedErrorChunks.push(processedChunk);
}

function emitModuleChunk(
  request: Request,
  id: number,
  moduleMetaData: ModuleMetaData,
): void {
  const processedChunk = processModuleChunk(request, id, moduleMetaData);
  request.completedModuleChunks.push(processedChunk);
}

function emitSymbolChunk(request: Request, id: number, name: string): void {
  const processedChunk = processSymbolChunk(request, id, name);
  request.completedModuleChunks.push(processedChunk);
}

function emitProviderChunk(
  request: Request,
  id: number,
  contextName: string,
): void {
  const processedChunk = processProviderChunk(request, id, contextName);
  request.completedJSONChunks.push(processedChunk);
}

function retryTask(request: Request, task: Task): void {
  if (task.status !== PENDING) {
    // We completed this by other means before we had a chance to retry it.
    return;
  }

  switchContext(task.context);
  try {
    let value = task.model;
    if (
      typeof value === 'object' &&
      value !== null &&
      (value: any).$$typeof === REACT_ELEMENT_TYPE
    ) {
      // TODO: Concatenate keys of parents onto children.
      const element: React$Element<any> = (value: any);

      // When retrying a component, reuse the thenableState from the
      // previous attempt.
      const prevThenableState = task.thenableState;

      // Attempt to render the Server Component.
      // Doing this here lets us reuse this same task if the next component
      // also suspends.
      task.model = value;
      value = attemptResolveElement(
        element.type,
        element.key,
        element.ref,
        element.props,
        prevThenableState,
      );

      // Successfully finished this component. We're going to keep rendering
      // using the same task, but we reset its thenable state before continuing.
      task.thenableState = null;

      // Keep rendering and reuse the same task. This inner loop is separate
      // from the render above because we don't need to reset the thenable state
      // until the next time something suspends and retries.
      while (
        typeof value === 'object' &&
        value !== null &&
        (value: any).$$typeof === REACT_ELEMENT_TYPE
      ) {
        // TODO: Concatenate keys of parents onto children.
        const nextElement: React$Element<any> = (value: any);
        task.model = value;
        value = attemptResolveElement(
          nextElement.type,
          nextElement.key,
          nextElement.ref,
          nextElement.props,
          null,
        );
      }
    }

    const processedChunk = processModelChunk(request, task.id, value);
    request.completedJSONChunks.push(processedChunk);
    request.abortableTasks.delete(task);
    task.status = COMPLETED;
  } catch (thrownValue) {
    const x =
      thrownValue === SuspenseException
        ? // This is a special type of exception used for Suspense. For historical
          // reasons, the rest of the Suspense implementation expects the thrown
          // value to be a thenable, because before `use` existed that was the
          // (unstable) API for suspending. This implementation detail can change
          // later, once we deprecate the old API in favor of `use`.
          getSuspendedThenable()
        : thrownValue;
    // $FlowFixMe[method-unbinding]
    if (typeof x === 'object' && x !== null && typeof x.then === 'function') {
      // Something suspended again, let's pick it back up later.
      const ping = task.ping;
      x.then(ping, ping);
      task.thenableState = getThenableStateAfterSuspending();
      return;
    } else {
      request.abortableTasks.delete(task);
      task.status = ERRORED;
      const digest = logRecoverableError(request, x);
      if (__DEV__) {
        const {message, stack} = getErrorMessageAndStackDev(x);
        emitErrorChunkDev(request, task.id, digest, message, stack);
      } else {
        emitErrorChunkProd(request, task.id, digest);
      }
    }
  }
}

function performWork(request: Request): void {
  const prevDispatcher = ReactCurrentDispatcher.current;
  const prevCache = getCurrentCache();
  ReactCurrentDispatcher.current = HooksDispatcher;
  setCurrentCache(request.cache);
  prepareToUseHooksForRequest(request);

  try {
    const pingedTasks = request.pingedTasks;
    request.pingedTasks = [];
    for (let i = 0; i < pingedTasks.length; i++) {
      const task = pingedTasks[i];
      retryTask(request, task);
    }
    if (request.destination !== null) {
      flushCompletedChunks(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher;
    setCurrentCache(prevCache);
    resetHooksForRequest();
  }
}

function abortTask(task: Task, request: Request, errorId: number): void {
  task.status = ABORTED;
  // Instead of emitting an error per task.id, we emit a model that only
  // has a single value referencing the error.
  const ref = serializeByValueID(errorId);
  const processedChunk = processReferenceChunk(request, task.id, ref);
  request.completedErrorChunks.push(processedChunk);
}

function flushCompletedChunks(
  request: Request,
  destination: Destination,
): void {
  beginWriting(destination);
  try {
    // We emit module chunks first in the stream so that
    // they can be preloaded as early as possible.
    const moduleChunks = request.completedModuleChunks;
    let i = 0;
    for (; i < moduleChunks.length; i++) {
      request.pendingChunks--;
      const chunk = moduleChunks[i];
      const keepWriting: boolean = writeChunkAndReturn(destination, chunk);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    moduleChunks.splice(0, i);
    // Next comes model data.
    const jsonChunks = request.completedJSONChunks;
    i = 0;
    for (; i < jsonChunks.length; i++) {
      request.pendingChunks--;
      const chunk = jsonChunks[i];
      const keepWriting: boolean = writeChunkAndReturn(destination, chunk);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    jsonChunks.splice(0, i);
    // Finally, errors are sent. The idea is that it's ok to delay
    // any error messages and prioritize display of other parts of
    // the page.
    const errorChunks = request.completedErrorChunks;
    i = 0;
    for (; i < errorChunks.length; i++) {
      request.pendingChunks--;
      const chunk = errorChunks[i];
      const keepWriting: boolean = writeChunkAndReturn(destination, chunk);
      if (!keepWriting) {
        request.destination = null;
        i++;
        break;
      }
    }
    errorChunks.splice(0, i);
  } finally {
    completeWriting(destination);
  }
  flushBuffered(destination);
  if (request.pendingChunks === 0) {
    // We're done.
    close(destination);
  }
}

export function startWork(request: Request): void {
  if (supportsRequestStorage) {
    scheduleWork(() => requestStorage.run(request.cache, performWork, request));
  } else {
    scheduleWork(() => performWork(request));
  }
}

export function startFlowing(request: Request, destination: Destination): void {
  if (request.status === CLOSING) {
    request.status = CLOSED;
    closeWithError(destination, request.fatalError);
    return;
  }
  if (request.status === CLOSED) {
    return;
  }
  if (request.destination !== null) {
    // We're already flowing.
    return;
  }
  request.destination = destination;
  try {
    flushCompletedChunks(request, destination);
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

// This is called to early terminate a request. It creates an error at all pending tasks.
export function abort(request: Request, reason: mixed): void {
  try {
    const abortableTasks = request.abortableTasks;
    if (abortableTasks.size > 0) {
      // We have tasks to abort. We'll emit one error row and then emit a reference
      // to that row from every row that's still remaining.
      const error =
        reason === undefined
          ? new Error('The render was aborted by the server without a reason.')
          : reason;

      const digest = logRecoverableError(request, error);
      request.pendingChunks++;
      const errorId = request.nextChunkId++;
      if (__DEV__) {
        const {message, stack} = getErrorMessageAndStackDev(error);
        emitErrorChunkDev(request, errorId, digest, message, stack);
      } else {
        emitErrorChunkProd(request, errorId, digest);
      }
      abortableTasks.forEach(task => abortTask(task, request, errorId));
      abortableTasks.clear();
    }
    if (request.destination !== null) {
      flushCompletedChunks(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

function importServerContexts(
  contexts?: Array<[string, ServerContextJSONValue]>,
) {
  if (contexts) {
    const prevContext = getActiveContext();
    switchContext(rootContextSnapshot);
    for (let i = 0; i < contexts.length; i++) {
      const [name, value] = contexts[i];
      const context = getOrCreateServerContext(name);
      pushProvider(context, value);
    }
    const importedContext = getActiveContext();
    switchContext(prevContext);
    return importedContext;
  }
  return rootContextSnapshot;
}
