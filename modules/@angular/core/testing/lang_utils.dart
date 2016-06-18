library testing.lang_utils;

import 'dart:mirrors';

Type getTypeOf(instance) => instance.runtimeType;

dynamic instantiateType(Type type, [List params = const []]) {
  var cm = reflectClass(type);
  return cm.newInstance(new Symbol(''), params).reflectee;
}
