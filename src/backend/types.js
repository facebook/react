// @flow

import type { ElementType } from 'src/devtools/types';

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
export type RendererID = string;

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
};

export type RendererInterface = {
  cleanup: () => void,
  getNativeFromReactElement?: ?(component: Fiber) => ?NativeType,
  getReactElementFromNative?: ?(component: NativeType) => ?Fiber,
  handleCommitFiberRoot: (fiber: Object) => void,
  renderer: ReactRenderer | null,
  walkTree: () => void,
};

export type Handler = (data: any) => void;

export type Hook = {
  listeners: { [key: string]: Array<Handler> },
  rendererInterfaces: { [key: string]: RendererInterface },
  renderers: { [key: string]: ReactRenderer },

  emit: (evt: string, data: any) => void,
  getFiberRoots: (rendererID: string) => Set<Object>,
  inject: (renderer: ReactRenderer) => string | null,
  on: (evt: string, handler: Handler) => void,
  off: (evt: string, handler: Handler) => void,
  reactDevtoolsAgent?: ?Object,
  sub: (evt: string, handler: Handler) => () => void,

  // React uses these methods.
  checkDCE: (fn: Function) => void,
  onCommitFiberUnmount: (rendererID: RendererID, fiber: Object) => void,
  onCommitFiberRoot: (rendererID: RendererID, fiber: Object) => void,
};
