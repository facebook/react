import {FORM_PROVIDERS} from '@angular/common';
import {APPLICATION_COMMON_PROVIDERS, APP_INITIALIZER, ExceptionHandler, NgZone, OpaqueToken, PLATFORM_COMMON_PROVIDERS, PlatformRef, ReflectiveInjector, RootRenderer, assertPlatform, createPlatform, getPlatform} from '@angular/core';

import {BROWSER_SANITIZATION_PROVIDERS} from './browser';
import {isBlank, print} from './facade/lang';
import {ON_WEB_WORKER} from './web_workers/shared/api';
import {ClientMessageBrokerFactory, ClientMessageBrokerFactory_} from './web_workers/shared/client_message_broker';
import {MessageBus} from './web_workers/shared/message_bus';
import {PostMessageBus, PostMessageBusSink, PostMessageBusSource} from './web_workers/shared/post_message_bus';
import {RenderStore} from './web_workers/shared/render_store';
import {Serializer} from './web_workers/shared/serializer';
import {ServiceMessageBrokerFactory, ServiceMessageBrokerFactory_} from './web_workers/shared/service_message_broker';
import {WebWorkerRootRenderer} from './web_workers/worker/renderer';
import {WorkerDomAdapter} from './web_workers/worker/worker_adapter';

class PrintLogger {
  log = print;
  logError = print;
  logGroup = print;
  logGroupEnd() {}
}

const WORKER_APP_PLATFORM_MARKER = new OpaqueToken('WorkerAppPlatformMarker');

/**
 * @experimental
 */
export const WORKER_APP_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> =
    [PLATFORM_COMMON_PROVIDERS, {provide: WORKER_APP_PLATFORM_MARKER, useValue: true}];

/**
 * @experimental
 */
export const WORKER_APP_APPLICATION_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  APPLICATION_COMMON_PROVIDERS, FORM_PROVIDERS, BROWSER_SANITIZATION_PROVIDERS, Serializer,
  {provide: ClientMessageBrokerFactory, useClass: ClientMessageBrokerFactory_},
  {provide: ServiceMessageBrokerFactory, useClass: ServiceMessageBrokerFactory_},
  WebWorkerRootRenderer, {provide: RootRenderer, useExisting: WebWorkerRootRenderer},
  {provide: ON_WEB_WORKER, useValue: true}, RenderStore,
  {provide: ExceptionHandler, useFactory: _exceptionHandler, deps: []},
  {provide: MessageBus, useFactory: createMessageBus, deps: [NgZone]},
  {provide: APP_INITIALIZER, useValue: setupWebWorker, multi: true}
];

/**
 * @experimental
 */
export function workerAppPlatform(): PlatformRef {
  if (isBlank(getPlatform())) {
    createPlatform(ReflectiveInjector.resolveAndCreate(WORKER_APP_PLATFORM_PROVIDERS));
  }
  return assertPlatform(WORKER_APP_PLATFORM_MARKER);
}

function _exceptionHandler(): ExceptionHandler {
  return new ExceptionHandler(new PrintLogger());
}

// TODO(jteplitz602) remove this and compile with lib.webworker.d.ts (#3492)
let _postMessage = {
  postMessage: (message: any, transferrables?: [ArrayBuffer]) => {
    (<any>postMessage)(message, transferrables);
  }
};

function createMessageBus(zone: NgZone): MessageBus {
  let sink = new PostMessageBusSink(_postMessage);
  let source = new PostMessageBusSource();
  let bus = new PostMessageBus(sink, source);
  bus.attachToZone(zone);
  return bus;
}

function setupWebWorker(): void {
  WorkerDomAdapter.makeCurrent();
}
