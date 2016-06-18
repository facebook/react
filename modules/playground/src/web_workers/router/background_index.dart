library playground.src.web_workers.router.background_index;

import "index_common.dart" show App;
import "dart:isolate";
import "package:angular2/platform/worker_app.dart";
import "package:angular2/core.dart";
import "package:angular2/platform/common.dart" show LocationStrategy, HashLocationStrategy;
import "package:angular2/src/web_workers/worker/router_providers.dart";

@AngularEntrypoint()
main(List<String> args, SendPort replyTo) {
  bootstrapApp(replyTo, App, [WORKER_APP_ROUTER, new Provider(LocationStrategy, useClass: HashLocationStrategy)]);
}
