library web_foo;

import 'package:angular2/src/core/application.dart';
import 'package:angular2/src/core/reflection/reflection.dart';
import 'package:angular2/src/core/reflection/reflection_capabilities.dart';
import 'hello.dart' deferred as a; // ng_deps. Should be rewritten.
import 'b.dart' deferred as b; // No ng_deps. Shouldn't be rewritten.

void main() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  a.loadLibrary().then((_) {
    bootstrap(a.HelloCmp);
  });
  b.loadLibrary();
}
