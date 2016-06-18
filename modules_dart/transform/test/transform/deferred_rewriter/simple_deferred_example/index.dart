library web_foo;

import 'package:angular2/src/core/application.dart';
import 'package:angular2/src/core/reflection/reflection.dart';
import 'package:angular2/src/core/reflection/reflection_capabilities.dart';
import 'hello.dart' deferred as a;

void main() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  a.loadLibrary().then((_) {
    bootstrap(a.HelloCmp);
  });
}
