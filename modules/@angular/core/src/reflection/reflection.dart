library reflection.reflection;

import 'reflector.dart';
import 'types.dart';
export 'reflector.dart';
import 'platform_reflection_capabilities.dart';
import 'package:angular2/src/facade/lang.dart';

class NoReflectionCapabilities implements PlatformReflectionCapabilities {
  @override
  bool isReflectionEnabled() {
    return false;
  }

  @override
  Function factory(Type type) {
    throw "Cannot find reflection information on ${stringify(type)}";
  }

  @override
  List interfaces(Type type) {
    throw "Cannot find reflection information on ${stringify(type)}";
  }

  @override
  List<List> parameters(dynamic type) {
    throw "Cannot find reflection information on ${stringify(type)}";
  }

  @override
  List annotations(dynamic type) {
    throw "Cannot find reflection information on ${stringify(type)}";
  }

  @override
  Map<String, List> propMetadata(dynamic type) {
    throw "Cannot find reflection information on ${stringify(type)}";
  }

  @override
  GetterFn getter(String name) {
    throw "Cannot find getter ${name}";
  }

  @override
  SetterFn setter(String name) {
    throw "Cannot find setter ${name}";
  }

  @override
  MethodFn method(String name) {
    throw "Cannot find method ${name}";
  }

  @override
  String importUri(Type type) => './';
}

final Reflector reflector = new Reflector(new NoReflectionCapabilities());
