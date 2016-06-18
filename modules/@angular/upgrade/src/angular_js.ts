export interface IModule {
  config(fn: any): IModule;
  directive(selector: string, factory: any): IModule;
  component(selector: string, component: IComponent): IModule;
  controller(name: string, type: any): IModule;
  factory(key: string, factoryFn: any): IModule;
  value(key: string, value: any): IModule;
  run(a: any): void;
}
export interface ICompileService {
  (element: Element|NodeList|string, transclude?: Function): ILinkFn;
}
export interface ILinkFn {
  (scope: IScope, cloneAttachFn?: Function, options?: ILinkFnOptions): void;
}
export interface ILinkFnOptions {
  parentBoundTranscludeFn?: Function;
  transcludeControllers?: {[key: string]: any};
  futureParentElement?: Node;
}
export interface IRootScopeService {
  $new(isolate?: boolean): IScope;
  $id: string;
  $watch(expr: any, fn?: (a1?: any, a2?: any) => void): Function;
  $destroy(): any;
  $apply(): any;
  $apply(exp: string): any;
  $apply(exp: Function): any;
  $evalAsync(): any;
  $$childTail: IScope;
  $$childHead: IScope;
  $$nextSibling: IScope;
}
export interface IScope extends IRootScopeService {}
export interface IAngularBootstrapConfig {}
export interface IDirective {
  compile?: IDirectiveCompileFn;
  controller?: any;
  controllerAs?: string;
  bindToController?: boolean|Object;
  link?: IDirectiveLinkFn|IDirectivePrePost;
  name?: string;
  priority?: number;
  replace?: boolean;
  require?: any;
  restrict?: string;
  scope?: any;
  template?: any;
  templateUrl?: any;
  terminal?: boolean;
  transclude?: any;
}
export interface IDirectiveCompileFn {
  (templateElement: IAugmentedJQuery, templateAttributes: IAttributes,
   transclude: ITranscludeFunction): IDirectivePrePost;
}
export interface IDirectivePrePost {
  pre?: IDirectiveLinkFn;
  post?: IDirectiveLinkFn;
}
export interface IDirectiveLinkFn {
  (scope: IScope, instanceElement: IAugmentedJQuery, instanceAttributes: IAttributes,
   controller: any, transclude: ITranscludeFunction): void;
}
export interface IComponent {
  bindings?: Object;
  controller?: any;
  controllerAs?: string;
  require?: any;
  template?: any;
  templateUrl?: any;
  transclude?: any;
}
export interface IAttributes { $observe(attr: string, fn: (v: string) => void): void; }
export interface ITranscludeFunction {
  // If the scope is provided, then the cloneAttachFn must be as well.
  (scope: IScope, cloneAttachFn: ICloneAttachFunction): IAugmentedJQuery;
  // If one argument is provided, then it's assumed to be the cloneAttachFn.
  (cloneAttachFn?: ICloneAttachFunction): IAugmentedJQuery;
}
export interface ICloneAttachFunction {
  // Let's hint but not force cloneAttachFn's signature
  (clonedElement?: IAugmentedJQuery, scope?: IScope): any;
}
export interface IAugmentedJQuery {
  bind(name: string, fn: () => void): void;
  data(name: string, value?: any): any;
  inheritedData(name: string, value?: any): any;
  contents(): IAugmentedJQuery;
  parent(): IAugmentedJQuery;
  length: number;
  [index: number]: Node;
}
export interface IParseService { (expression: string): ICompiledExpression; }
export interface ICompiledExpression { assign(context: any, value: any): any; }
export interface IHttpBackendService {
  (method: string, url: string, post?: any, callback?: Function, headers?: any, timeout?: number,
   withCredentials?: boolean): void;
}
export interface ICacheObject {
  put<T>(key: string, value?: T): T;
  get(key: string): any;
}
export interface ITemplateCacheService extends ICacheObject {}
export interface IControllerService {
  (controllerConstructor: Function, locals?: any, later?: any, ident?: any): any;
  (controllerName: string, locals?: any): any;
}

export interface IInjectorService { get(key: string): any; }

export interface ITestabilityService {
  findBindings(element: Element, expression: string, opt_exactMatch?: boolean): Element[];
  findModels(element: Element, expression: string, opt_exactMatch?: boolean): Element[];
  getLocation(): string;
  setLocation(url: string): void;
  whenStable(callback: Function): void;
}

function noNg() {
  throw new Error('AngularJS v1.x is not loaded!');
}

var angular: {
  bootstrap: (e: Element, modules: string[], config: IAngularBootstrapConfig) => void,
  module: (prefix: string, dependencies?: string[]) => IModule,
  element: (e: Element) => IAugmentedJQuery,
  version: {major: number}, resumeBootstrap?: () => void,
  getTestability: (e: Element) => ITestabilityService
} = <any>{
  bootstrap: noNg,
  module: noNg,
  element: noNg,
  version: noNg,
  resumeBootstrap: noNg,
  getTestability: noNg
};


try {
  if (window.hasOwnProperty('angular')) {
    angular = (<any>window).angular;
  }
} catch (e) {
  // ignore in CJS mode.
}

export var bootstrap = angular.bootstrap;
export var module = angular.module;
export var element = angular.element;
export var version = angular.version;
export var resumeBootstrap = angular.resumeBootstrap;
export var getTestability = angular.getTestability;
