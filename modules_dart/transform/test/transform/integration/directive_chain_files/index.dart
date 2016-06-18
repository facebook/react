library web_foo;

import 'package:angular2/platform/browser.dart';
import 'package:angular2/src/core/reflection/reflection_capabilities.dart';
import 'bar.dart';

void main() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  bootstrap(MyComponent);
}
