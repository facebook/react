library playground.src.web_workers.todo.background_index;

import "index_common.dart" show TodoApp;
import "dart:isolate";
import "package:angular2/platform/worker_app.dart";
import "package:angular2/core.dart";

@AngularEntrypoint()
main(List<String> args, SendPort replyTo) {
  bootstrapApp(replyTo, TodoApp);
}
