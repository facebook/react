import {COMMON_DIRECTIVES, COMMON_PIPES} from '@angular/common';
import {COMPILER_PROVIDERS, CompilerConfig, XHR} from '@angular/compiler';
import {ApplicationRef, ComponentRef, PLATFORM_DIRECTIVES, PLATFORM_PIPES, ReflectiveInjector, Type, coreLoadAndBootstrap} from '@angular/core';
import {BROWSER_APP_PROVIDERS, WORKER_APP_APPLICATION_PROVIDERS, WORKER_SCRIPT, WORKER_UI_APPLICATION_PROVIDERS, browserPlatform, workerAppPlatform, workerUiPlatform} from '@angular/platform-browser';

import {ReflectionCapabilities, reflector} from './core_private';
import {PromiseWrapper} from './src/facade/async';
import {isPresent} from './src/facade/lang';
import {CachedXHR} from './src/xhr/xhr_cache';
import {XHRImpl} from './src/xhr/xhr_impl';


export const BROWSER_APP_COMPILER_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  COMPILER_PROVIDERS, {
    provide: CompilerConfig,
    useFactory: (platformDirectives: any[], platformPipes: any[]) => {
      return new CompilerConfig({platformDirectives, platformPipes});
    },
    deps: [PLATFORM_DIRECTIVES, PLATFORM_PIPES]
  },
  {provide: XHR, useClass: XHRImpl},
  {provide: PLATFORM_DIRECTIVES, useValue: COMMON_DIRECTIVES, multi: true},
  {provide: PLATFORM_PIPES, useValue: COMMON_PIPES, multi: true}
];


export const CACHED_TEMPLATE_PROVIDER: Array<any /*Type | Provider | any[]*/> =
    [{provide: XHR, useClass: CachedXHR}];



/**
 * Bootstrapping for Angular applications.
 *
 * You instantiate an Angular application by explicitly specifying a component to use
 * as the root component for your application via the `bootstrap()` method.
 *
 * ## Simple Example
 *
 * Assuming this `index.html`:
 *
 * ```html
 * <html>
 *   <!-- load Angular script tags here. -->
 *   <body>
 *     <my-app>loading...</my-app>
 *   </body>
 * </html>
 * ```
 *
 * An application is bootstrapped inside an existing browser DOM, typically `index.html`.
 * Unlike Angular 1, Angular 2 does not compile/process providers in `index.html`. This is
 * mainly for security reasons, as well as architectural changes in Angular 2. This means
 * that `index.html` can safely be processed using server-side technologies such as
 * providers. Bindings can thus use double-curly `{{ syntax }}` without collision from
 * Angular 2 component double-curly `{{ syntax }}`.
 *
 * We can use this script code:
 *
 * {@example core/ts/bootstrap/bootstrap.ts region='bootstrap'}
 *
 * When the app developer invokes `bootstrap()` with the root component `MyApp` as its
 * argument, Angular performs the following tasks:
 *
 *  1. It uses the component's `selector` property to locate the DOM element which needs
 *     to be upgraded into the angular component.
 *  2. It creates a new child injector (from the platform injector). Optionally, you can
 *     also override the injector configuration for an app by invoking `bootstrap` with the
 *     `componentInjectableBindings` argument.
 *  3. It creates a new `Zone` and connects it to the angular application's change detection
 *     domain instance.
 *  4. It creates an emulated or shadow DOM on the selected component's host element and loads the
 *     template into it.
 *  5. It instantiates the specified component.
 *  6. Finally, Angular performs change detection to apply the initial data providers for the
 *     application.
 *
 *
 * ## Bootstrapping Multiple Applications
 *
 * When working within a browser window, there are many singleton resources: cookies, title,
 * location, and others. Angular services that represent these resources must likewise be
 * shared across all Angular applications that occupy the same browser window. For this
 * reason, Angular creates exactly one global platform object which stores all shared
 * services, and each angular application injector has the platform injector as its parent.
 *
 * Each application has its own private injector as well. When there are multiple
 * applications on a page, Angular treats each application injector's services as private
 * to that application.
 *
 * ## API
 *
 * - `appComponentType`: The root component which should act as the application. This is
 *   a reference to a `Type` which is annotated with `@Component(...)`.
 * - `customProviders`: An additional set of providers that can be added to the
 *   app injector to override default injection behavior.
 *
 * Returns a `Promise` of {@link ComponentRef}.
 */
export function bootstrap(
    appComponentType: Type,
    customProviders?: Array<any /*Type | Provider | any[]*/>): Promise<ComponentRef<any>> {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  let providers = [
    BROWSER_APP_PROVIDERS, BROWSER_APP_COMPILER_PROVIDERS,
    isPresent(customProviders) ? customProviders : []
  ];
  var appInjector = ReflectiveInjector.resolveAndCreate(providers, browserPlatform().injector);
  return coreLoadAndBootstrap(appComponentType, appInjector);
}


/**
 * @experimental
 */
export function bootstrapWorkerUi(
    workerScriptUri: string,
    customProviders?: Array<any /*Type | Provider | any[]*/>): Promise<ApplicationRef> {
  var app = ReflectiveInjector.resolveAndCreate(
      [
        WORKER_UI_APPLICATION_PROVIDERS, BROWSER_APP_COMPILER_PROVIDERS,
        {provide: WORKER_SCRIPT, useValue: workerScriptUri},
        isPresent(customProviders) ? customProviders : []
      ],
      workerUiPlatform().injector);
  // Return a promise so that we keep the same semantics as Dart,
  // and we might want to wait for the app side to come up
  // in the future...
  return PromiseWrapper.resolve(app.get(ApplicationRef));
}


/**
 * @experimental
 */
const WORKER_APP_COMPILER_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  COMPILER_PROVIDERS, {
    provide: CompilerConfig,
    useFactory: (platformDirectives: any[], platformPipes: any[]) => {
      return new CompilerConfig({platformDirectives, platformPipes});
    },
    deps: [PLATFORM_DIRECTIVES, PLATFORM_PIPES]
  },
  {provide: XHR, useClass: XHRImpl},
  {provide: PLATFORM_DIRECTIVES, useValue: COMMON_DIRECTIVES, multi: true},
  {provide: PLATFORM_PIPES, useValue: COMMON_PIPES, multi: true}
];


/**
 * @experimental
 */
export function bootstrapWorkerApp(
    appComponentType: Type,
    customProviders?: Array<any /*Type | Provider | any[]*/>): Promise<ComponentRef<any>> {
  var appInjector = ReflectiveInjector.resolveAndCreate(
      [
        WORKER_APP_APPLICATION_PROVIDERS, WORKER_APP_COMPILER_PROVIDERS,
        isPresent(customProviders) ? customProviders : []
      ],
      workerAppPlatform().injector);
  return coreLoadAndBootstrap(appComponentType, appInjector);
}
