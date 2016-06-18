library playground.hello_world.index_common_dart.ng_deps.dart;

import 'dependency.dart';
import 'dependency.ng_deps.dart' as i0;
import 'hello.dart';
import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

var _visited = false;
void initReflector(reflector) {
  if (_visited) return;
  _visited = true;
  reflector
    ..registerType(
        TextBindingsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'text'),
          const View(template: '{{textBindings}}')
        ], const [
          const []
        ], () => new TextBindingsCmp()))
    ..registerType(
        PropertyBindingsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'props'),
          const View(template: '<div [prop-name]="propValue"></div>')
        ], const [
          const []
        ], () => new PropertyBindingsCmp()))
    ..registerType(
        EventsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'events', outputs: const ['eventName']),
          const View(template: 'Hi')
        ], const [
          const []
        ], () => new EventsCmp()))
    ..registerType(
        SubEventsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'sub-events'),
          const View(
              template: '<dependency></dependency>',
              directives: const [DependencyCmp])
        ], const [
          const []
        ], () => new SubEventsCmp()))
    ..registerType(
        TemplateEventsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'template-events'),
          const View(template: '<div (mouseover)="onMouseOver()"></div>')
        ], const [
          const []
        ], () => new TemplateEventsCmp()))
    ..registerType(
        DirectivePropsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'directive-props-cmp'),
          const View(
              template: '<div dir-props prop="somevalue">',
              directives: const [DirectiveProps])
        ], const [
          const []
        ], () => new DirectivePropsCmp()))
    ..registerType(
        DirectiveEventsCmp,
        new ReflectionInfo(const [
          const Component(selector: 'directive-events-cmp'),
          const View(
              template: '<div dir-events (subevent)="field = 10;">',
              directives: const [DirectiveEvents])
        ], const [
          const []
        ], () => new DirectiveEventsCmp()))
    ..registerType(
        RecursiveCmp,
        new ReflectionInfo(const [
          const Component(selector: 'recursive-cmp'),
          const View(
              template:
                  '<li *ngFor="#thing of things" [recursive-prop]="thing"><div>test</div></li>',
              directives: const [NgFor])
        ], const [
          const []
        ], () => new RecursiveCmp()));
  i0.initReflector();
}
