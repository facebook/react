library angular2.examples.message_broker.index;

import "package:angular2/platform/worker_render.dart";
import "package:angular2/core.dart";
import "dart:html";

@AngularEntrypoint()
main() {
  const ECHO_CHANNEL = "ECHO";
  bootstrapRender("background_index.dart")
      .then((ref) {
    var brokerFactory = ref.injector.get(ClientMessageBrokerFactory);
    var broker = brokerFactory.createMessageBroker(ECHO_CHANNEL, false);
    querySelector("#send_echo").addEventListener("click", (e) {
      var val = (querySelector("#echo_input") as InputElement).value;
      var args = new UiArguments("echo", [new FnArg(val, PRIMITIVE)]);
      broker.runOnService(args, PRIMITIVE).then((echo_result) {
        querySelector("#echo_result")
            .appendHtml("<span class='response'>${echo_result}</span>");
      });
    });
  });
}
