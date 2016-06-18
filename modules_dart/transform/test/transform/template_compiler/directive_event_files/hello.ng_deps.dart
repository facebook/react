library playground.hello_world.index_common_dart.ng_deps.dart;

import 'hello.dart';
import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

var _visited = false;
void initReflector(reflector) {
  if (_visited) return;
  _visited = true;
  reflector
    ..registerType(
        HelloDirective,
        new ReflectionInfo(const [
          const Directive(selector: 'hello', outputs: const ['eventName'])
        ], const [
          const []
        ], () => new HelloDirective()));
}
