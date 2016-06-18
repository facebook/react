import {APPLICATION_COMMON_PROVIDERS, APP_INITIALIZER, ApplicationRef, ExceptionHandler, Injectable, Injector, NgZone, OpaqueToken, PLATFORM_COMMON_PROVIDERS, PLATFORM_INITIALIZER, PlatformRef, ReflectiveInjector, RootRenderer, Testability, assertPlatform, createPlatform, getPlatform} from '@angular/core';

import {AnimationDriver, NoOpAnimationDriver, wtfInit} from '../core_private';

import {BROWSER_SANITIZATION_PROVIDERS} from './browser';
import {BrowserDomAdapter} from './browser/browser_adapter';
import {BrowserGetTestability} from './browser/testability';
import {getDOM} from './dom/dom_adapter';
import {DomRootRenderer, DomRootRenderer_} from './dom/dom_renderer';
import {DOCUMENT} from './dom/dom_tokens';
import {DomEventsPlugin} from './dom/events/dom_events';
import {EVENT_MANAGER_PLUGINS, EventManager} from './dom/events/event_manager';
import {HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerGesturesPlugin} from './dom/events/hammer_gestures';
import {KeyEventsPlugin} from './dom/events/key_events';
import {DomSharedStylesHost, SharedStylesHost} from './dom/shared_styles_host';
import {BaseException} from './facade/exceptions';
import {isBlank} from './facade/lang';
import {ON_WEB_WORKER} from './web_workers/shared/api';
import {ClientMessageBrokerFactory, ClientMessageBrokerFactory_} from './web_workers/shared/client_message_broker';
import {MessageBus} from './web_workers/shared/message_bus';
import {PostMessageBus, PostMessageBusSink, PostMessageBusSource} from './web_workers/shared/post_message_bus';
import {RenderStore} from './web_workers/shared/render_store';
import {Serializer} from './web_workers/shared/serializer';
import {ServiceMessageBrokerFactory, ServiceMessageBrokerFactory_} from './web_workers/shared/service_message_broker';
import {MessageBasedRenderer} from './web_workers/ui/renderer';

const WORKER_RENDER_PLATFORM_MARKER = new OpaqueToken('WorkerRenderPlatformMarker');

/**
 * Wrapper class that exposes the Worker
 * and underlying {@link MessageBus} for lower level message passing.
 * @experimental
 */
@Injectable()
export class WebWorkerInstance {
  public worker: Worker;
  public bus: MessageBus;

  /** @internal */
  public init(worker: Worker, bus: MessageBus) {
    this.worker = worker;
    this.bus = bus;
  }
}

/**
 * @experimental
 */
export const WORKER_SCRIPT: OpaqueToken = new OpaqueToken('WebWorkerScript');

/**
 * A multiple providers used to automatically call the `start()` method after the service is
 * created.
 *
 * TODO(vicb): create an interface for startable services to implement
 * @experimental
 */
export const WORKER_UI_STARTABLE_MESSAGING_SERVICE =
    new OpaqueToken('WorkerRenderStartableMsgService');

/**
 * @experimental
 */
export const WORKER_UI_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  PLATFORM_COMMON_PROVIDERS, {provide: WORKER_RENDER_PLATFORM_MARKER, useValue: true},
  {provide: PLATFORM_INITIALIZER, useValue: initWebWorkerRenderPlatform, multi: true}
];

/**
 * @experimental
 */
export const WORKER_UI_APPLICATION_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  APPLICATION_COMMON_PROVIDERS,
  MessageBasedRenderer,
  {provide: WORKER_UI_STARTABLE_MESSAGING_SERVICE, useExisting: MessageBasedRenderer, multi: true},
  BROWSER_SANITIZATION_PROVIDERS,
  {provide: ExceptionHandler, useFactory: _exceptionHandler, deps: []},
  {provide: DOCUMENT, useFactory: _document, deps: []},
  // TODO(jteplitz602): Investigate if we definitely need EVENT_MANAGER on the render thread
  // #5298
  {provide: EVENT_MANAGER_PLUGINS, useClass: DomEventsPlugin, multi: true},
  {provide: EVENT_MANAGER_PLUGINS, useClass: KeyEventsPlugin, multi: true},
  {provide: EVENT_MANAGER_PLUGINS, useClass: HammerGesturesPlugin, multi: true},
  {provide: HAMMER_GESTURE_CONFIG, useClass: HammerGestureConfig},
  {provide: DomRootRenderer, useClass: DomRootRenderer_},
  {provide: RootRenderer, useExisting: DomRootRenderer},
  {provide: SharedStylesHost, useExisting: DomSharedStylesHost},
  {provide: ServiceMessageBrokerFactory, useClass: ServiceMessageBrokerFactory_},
  {provide: ClientMessageBrokerFactory, useClass: ClientMessageBrokerFactory_},
  {provide: AnimationDriver, useFactory: _resolveDefaultAnimationDriver},
  Serializer,
  {provide: ON_WEB_WORKER, useValue: false},
  RenderStore,
  DomSharedStylesHost,
  Testability,
  EventManager,
  WebWorkerInstance,
  {provide: APP_INITIALIZER, useFactory: initWebWorkerAppFn, multi: true, deps: [Injector]},
  {provide: MessageBus, useFactory: messageBusFactory, deps: [WebWorkerInstance]}
];

function initializeGenericWorkerRenderer(injector: Injector) {
  var bus = injector.get(MessageBus);
  let zone = injector.get(NgZone);
  bus.attachToZone(zone);

  // initialize message services after the bus has been created
  let services = injector.get(WORKER_UI_STARTABLE_MESSAGING_SERVICE);
  zone.runGuarded(() => { services.forEach((svc: any /** TODO #9100 */) => { svc.start(); }); });
}

function messageBusFactory(instance: WebWorkerInstance): MessageBus {
  return instance.bus;
}

function initWebWorkerRenderPlatform(): void {
  BrowserDomAdapter.makeCurrent();
  wtfInit();
  BrowserGetTestability.init();
}

/**
 * @experimental
 */
export function workerUiPlatform(): PlatformRef {
  if (isBlank(getPlatform())) {
    createPlatform(ReflectiveInjector.resolveAndCreate(WORKER_UI_PLATFORM_PROVIDERS));
  }
  return assertPlatform(WORKER_RENDER_PLATFORM_MARKER);
}

function _exceptionHandler(): ExceptionHandler {
  return new ExceptionHandler(getDOM());
}

function _document(): any {
  return getDOM().defaultDoc();
}

function initWebWorkerAppFn(injector: Injector): () => void {
  return () => {
    var scriptUri: string;
    try {
      scriptUri = injector.get(WORKER_SCRIPT);
    } catch (e) {
      throw new BaseException(
          'You must provide your WebWorker\'s initialization script with the WORKER_SCRIPT token');
    }

    let instance = injector.get(WebWorkerInstance);
    spawnWebWorker(scriptUri, instance);

    initializeGenericWorkerRenderer(injector);
  };
}

/**
 * Spawns a new class and initializes the WebWorkerInstance
 */
function spawnWebWorker(uri: string, instance: WebWorkerInstance): void {
  var webWorker: Worker = new Worker(uri);
  var sink = new PostMessageBusSink(webWorker);
  var source = new PostMessageBusSource(webWorker);
  var bus = new PostMessageBus(sink, source);

  instance.init(webWorker, bus);
}

function _resolveDefaultAnimationDriver(): AnimationDriver {
  // web workers have not been tested or configured to
  // work with animations just yet...
  return new NoOpAnimationDriver();
}
