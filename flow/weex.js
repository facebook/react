// global flag to be compiled away
declare var __WEEX__: boolean;

// global object in Weex
declare var WXEnvironment: WeexEnvironment;

declare type Weex = {
  config: WeexConfigAPI;
  document: WeexDocument;
  requireModule: (name: string) => Object | void;
  supports: (condition: string) => boolean | void;
  isRegisteredModule: (name: string, method?: string) => boolean;
  isRegisteredComponent: (name: string) => boolean;
};

declare type WeexConfigAPI = {
  bundleUrl: string; // === weex.document.URL
  bundleType: string;
  env: WeexEnvironment; // === WXEnvironment
};

declare type WeexEnvironment = {
  platform: string; // could be "Web", "iOS", "Android"
  weexVersion: string; // the version of WeexSDK

  osName: string; // could be "iOS", "Android" or others
  osVersion: string;
  appName: string; // mobile app name or browser name
  appVersion: string;

  // informations of current running device
  deviceModel: string; // phone device model
  deviceWidth: number;
  deviceHeight: number;
  scale: number;

  // only available on the web
  userAgent?: string;
  dpr?: number;
  rem?: number;
};

declare interface WeexDocument {
  id: string;
  URL: string;
  taskCenter: WeexTaskCenter;

  open: () => void;
  close: () => void;
  createElement: (tagName: string, props?: Object) => WeexElement;
  createComment: (text: string) => Object;
  fireEvent: (type: string) => void;
  destroy: () => void;
};

declare interface WeexTaskCenter {
  instanceId: string;
  callbackManager: Object;
  send: (type: string, params: Object, args: Array<any>, options?: Object) => void;
  registerHook: (componentId: string, type: string, hook: string, fn: Function) => void;
  updateData: (componentId: string, data: Object | void, callback?: Function) => void;
};

declare interface WeexElement {
  nodeType: number;
  nodeId: string;
  type: string;
  ref: string;
  text?: string;

  parentNode: WeexElement | void;
  children: Array<WeexElement>;
  previousSibling: WeexElement | void;
  nextSibling: WeexElement | void;

  appendChild: (node: WeexElement) => void;
  removeChild: (node: WeexElement, preserved?: boolean) => void;
  insertBefore: (node: WeexElement, before: WeexElement) => void;
  insertAfter: (node: WeexElement, after: WeexElement) => void;
  setAttr: (key: string, value: any, silent?: boolean) => void;
  setAttrs: (attrs: Object, silent?: boolean) => void;
  setStyle: (key: string, value: any, silent?: boolean) => void;
  setStyles: (attrs: Object, silent?: boolean) => void;
  addEvent: (type: string, handler: Function, args?: Array<any>) => void;
  removeEvent: (type: string) => void;
  fireEvent: (type: string) => void;
  destroy: () => void;
};

declare type WeexInstanceOption = {
  instanceId: string;
  config: WeexConfigAPI;
  document: WeexDocument;
  Vue?: GlobalAPI;
  app?: Component;
  data?: Object;
};

declare type WeexRuntimeContext = {
  weex: Weex;
  service: Object;
  BroadcastChannel?: Function;
};

declare type WeexInstanceContext = {
  Vue: GlobalAPI;

  // DEPRECATED
  setTimeout?: Function;
  clearTimeout?: Function;
  setInterval?: Function;
  clearInterval?: Function;
};

declare type WeexCompilerOptions = CompilerOptions & {
  // whether to compile special template for <recycle-list>
  recyclable?: boolean;
};

declare type WeexCompiledResult = CompiledResult & {
  '@render'?: string;
};
