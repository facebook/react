library angular2.examples.message_broker.background_index;

import "package:angular2/platform/worker_app.dart";
import "package:angular2/core.dart";
import "index_common.dart" show App;
import "dart:isolate";

@AngularEntrypoint()
main(List<String> args, SendPort replyTo) {
  bootstrapApp(replyTo, App);
}
