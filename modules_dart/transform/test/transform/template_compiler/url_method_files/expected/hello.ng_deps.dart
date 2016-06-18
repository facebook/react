library playground.src.hello_world.index_common_dart;

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
          const View(templateUrl: 'template.html'),
          _templates.HostHelloCmpTemplate
        ], const [
          const []
        ], () => new HelloCmp()));
}
