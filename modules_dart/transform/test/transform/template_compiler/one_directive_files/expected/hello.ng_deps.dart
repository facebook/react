library playground.hello_world.index_common_dart.ng_deps.dart;

import 'hello.ngfactory.dart' as _templates;

import 'hello.dart';
import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

var _visited = false;
void initReflector(reflector) {
  if (_visited) return;
  _visited = true;
  reflector
    ..registerType(
        HelloCmp,
        new ReflectionInfo(const [
          const Component(selector: 'hello-app'),
          const View(template: 'goodbye-app', directives: const [GoodbyeCmp]),
          _templates.HostHelloCmpTemplate
        ], const [
          const []
        ], () => new HelloCmp()))
    ..registerType(
        GoodbyeCmp,
        new ReflectionInfo(const [
          const Component(selector: 'goodbye-app'),
          const View(template: 'Goodbye'),
          _templates.HostGoodbyeCmpTemplate
        ], const [
          const []
        ], () => new GoodbyeCmp()));
}
