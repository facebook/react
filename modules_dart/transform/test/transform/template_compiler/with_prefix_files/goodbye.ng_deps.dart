library playground.hello_world.index_common_dart.ng_deps.dart;

import 'goodbye.dart';
import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

var _visited = false;
void initReflector(reflector) {
  if (_visited) return;
  _visited = true;
  reflector
    ..registerType(
        GoodbyeCmp,
        new ReflectionInfo(const [
          const Component(selector: 'goodbye-app'),
          const View(template: 'Goodbye {{name}}')
        ], const [
          const []
        ], () => new GoodbyeCmp()));
}
