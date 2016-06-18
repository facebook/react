library playground.hello_world.index_common_dart.ng_deps.dart;

import 'hello.dart';
import 'package:angular2/angular2.dart'
    show bootstrap, Component, Directive, View, NgElement;

var _visited = false;
void initReflector(reflector) {
  if (_visited) return;
  _visited = true;
  reflector
    ..registerType(
        HelloCmp,
        new ReflectionInfo(const [
          const Component(selector: 'hello-app'),
          const View(template: 'goodbye-app', directives: const [GoodbyeCmp])
        ], const [
          const []
        ], () => new HelloCmp()))
    ..registerType(
        GoodbyeCmp,
        new ReflectionInfo(const [
          const Component(selector: 'goodbye-app'),
          const View(template: 'Goodbye')
        ], const [
          const []
        ], () => new GoodbyeCmp()));
}
