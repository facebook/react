// @flow

import type { ElementType, InspectedElement } from 'src/devtools/types';

type BundleType =
  | 0 // PROD
  | 1; // DEV

// TODO: Better type for Fiber
export type Fiber = Object;

// TODO: If it's useful for the frontend to know which types of data an Element has
// (e.g. props, state, context, hooks) then we could add a bitmask field for this
// to keep the number of attributes small.
export type FiberData = {|
  key: React$Key | null,
  displayName: string | null,
  type: ElementType,
|};

export type Interaction = {|
  name: string,
  timestamp: number,
|};

export type NativeType = {};
export type RendererID = number;

type Dispatcher = any;

export type ReactRenderer = {
  findHostInstanceByFiber: (fiber: Object) => ?NativeType,
  findFiberByHostInstance: (hostInstance: NativeType) => ?Fiber,
  version: string,
  bundleType: BundleType,
  overrideProps?: ?(
    fiber: Object,
    path: Array<string | number>,
    value: any
  ) => void,

  // Only injected by React v16.8+ in order to support hooks inspection.
  currentDispatcherRef?: {| current: null | Dispatcher |},
};

export type RendererInterface = {
  cleanup: () => void,
  getNativeFromReactElement?: ?(component: Fiber) => ?NativeType,
  getReactElementFromNative?: ?(component: NativeType) => ?Fiber,
  handleCommitFiberRoot: (fiber: Object) => void,
  handleCommitFiberUnmount: (fiber: Object) => void,
  inspectElement: (id: number) => InspectedElement | null,
  renderer: ReactRenderer | null,
  selectElement: (id: number) => void,
  walkTree: () => void,
};

export type Handler = (data: any) => void;

export type Hook = {
  listeners: { [key: string]: Array<Handler> },
  rendererInterfaces: Map<RendererID, RendererInterface>,
  renderers: Map<RendererID, ReactRenderer>,

  emit: (evt: string, data: any) => void,
  getFiberRoots: (rendererID: RendererID) => Set<Object>,
  inject: (renderer: ReactRenderer) => number | null,
  on: (evt: string, handler: Handler) => void,
  off: (evt: string, handler: Handler) => void,
  reactDevtoolsAgent?: ?Object,
  sub: (evt: string, handler: Handler) => () => void,

  // React uses these methods.
  checkDCE: (fn: Function) => void,
  onCommitFiberUnmount: (rendererID: RendererID, fiber: Object) => void,
  onCommitFiberRoot: (rendererID: RendererID, fiber: Object) => void,
};

export type HooksNode = {
  name: string,
  value: mixed,
  subHooks: Array<HooksNode>,
};
export type HooksTree = Array<HooksNode>;
