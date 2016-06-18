library angular2.examples.web_workers.todo.server_index;

import "index_common.dart" show TodoApp;
import "package:angular2/src/web_workers/debug_tools/multi_client_server_message_bus.dart";
import "package:angular2/platform/worker_app.dart";
import "package:angular2/core.dart";
import 'dart:io';
import "package:angular2/src/core/reflection/reflection_capabilities.dart";
import "package:angular2/src/core/reflection/reflection.dart";
import "package:angular2/src/platform/server/html_adapter.dart";

void main() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  HttpServer.bind('127.0.0.1', 1337).then((HttpServer server) {
    print("Server Listening for requests on 127.0.0.1:1337");
    var bus = new MultiClientServerMessageBus.fromHttpServer(server);

    var platform = createPlatform(ReflectiveInjector.resolveAndCreate(WORKER_APP_PLATFORM));
    var appInjector = ReflectiveInjector.resolveAndCreate([
      WORKER_APP_APPLICATION_COMMON,
      new Provider(MessageBus, useValue: bus),
      new Provider(APP_INITIALIZER,
          useFactory: initAppThread, multi: true, deps: [NgZone, MessageBus])
    ], platform.injector);
    coreLoadAndBootstrap(TodoApp, appInjector);
  });
}

initAppThread(NgZone zone, MessageBus bus) {
  return () {
    Html5LibDomAdapter.makeCurrent();
    bus.attachToZone(zone);
  };
}
