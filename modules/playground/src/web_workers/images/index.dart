library angular2.examples.web_workers.images.index;

import "package:angular2/platform/worker_render.dart";
import "package:angular2/core.dart";
import "package:angular2/src/core/reflection/reflection_capabilities.dart";
import "package:angular2/src/core/reflection/reflection.dart";

main() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  bootstrapRender("background_index.dart");
}
