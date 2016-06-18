library reflection.reflection_capabilities;

import 'dart:mirrors';

import 'package:angular2/src/core/metadata/lifecycle_hooks.dart';
import 'package:angular2/src/facade/lang.dart';

import 'platform_reflection_capabilities.dart';
import 'types.dart';

import '../linker/template_ref.dart';

var DOT_REGEX = new RegExp('\\.');

class ReflectionCapabilities implements PlatformReflectionCapabilities {
  Map<Symbol, Type> parameterizedTypeMapping = new Map<Symbol, Type>();

  ReflectionCapabilities([metadataReader]) {
    // In Dart, there is no way of getting from a parameterized Type to
    // the underlying non parameterized type.
    // So we need to have a separate Map for the types that are generic
    // and used in our DI...
    parameterizedTypeMapping[reflectType(TemplateRef).qualifiedName] = TemplateRef;
  }

  _typeFromMirror(TypeMirror typeMirror) {
    var result = parameterizedTypeMapping[typeMirror.qualifiedName];
    if (result == null && typeMirror.hasReflectedType && typeMirror.reflectedType != dynamic) {
      result = typeMirror.reflectedType;
    }
    return result;
  }

  bool isReflectionEnabled() {
    return true;
  }

  Function factory(Type type) {
    ClassMirror classMirror = reflectType(type);
    MethodMirror ctor = classMirror.declarations[classMirror.simpleName];
    Function create = classMirror.newInstance;
    Symbol name = ctor.constructorName;
    int length = ctor.parameters.length;

    switch (length) {
      case 0:
        return () => create(name, []).reflectee;
      case 1:
        return (a1) => create(name, [a1]).reflectee;
      case 2:
        return (a1, a2) => create(name, [a1, a2]).reflectee;
      case 3:
        return (a1, a2, a3) => create(name, [a1, a2, a3]).reflectee;
      case 4:
        return (a1, a2, a3, a4) => create(name, [a1, a2, a3, a4]).reflectee;
      case 5:
        return (a1, a2, a3, a4, a5) =>
            create(name, [a1, a2, a3, a4, a5]).reflectee;
      case 6:
        return (a1, a2, a3, a4, a5, a6) =>
            create(name, [a1, a2, a3, a4, a5, a6]).reflectee;
      case 7:
        return (a1, a2, a3, a4, a5, a6, a7) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7]).reflectee;
      case 8:
        return (a1, a2, a3, a4, a5, a6, a7, a8) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7, a8]).reflectee;
      case 9:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7, a8, a9]).reflectee;
      case 10:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10]).reflectee;
      case 11:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11])
                .reflectee;
      case 12:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) =>
            create(name, [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12])
                .reflectee;
      case 13:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13
            ]).reflectee;
      case 14:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14
            ]).reflectee;
      case 15:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15
            ]).reflectee;
      case 16:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15, a16) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15,
              a16
            ]).reflectee;
      case 17:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15, a16, a17) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15,
              a16,
              a17
            ]).reflectee;
      case 18:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15, a16, a17, a18) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15,
              a16,
              a17,
              a18
            ]).reflectee;
      case 19:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15, a16, a17, a18, a19) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15,
              a16,
              a17,
              a18,
              a19
            ]).reflectee;
      case 20:
        return (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14,
                a15, a16, a17, a18, a19, a20) =>
            create(name, [
              a1,
              a2,
              a3,
              a4,
              a5,
              a6,
              a7,
              a8,
              a9,
              a10,
              a11,
              a12,
              a13,
              a14,
              a15,
              a16,
              a17,
              a18,
              a19,
              a20
            ]).reflectee;
    }

    throw "Cannot create a factory for '${stringify(type)}' because its constructor has more than 20 arguments";
  }

  List<List> parameters(typeOrFunc) {
    final parameters = typeOrFunc is Type
        ? _constructorParameters(typeOrFunc)
        : _functionParameters(typeOrFunc);
    return parameters.map(_convertParameter).toList();
  }

  List _convertParameter(ParameterMirror p) {
    var t = p.type;
    var type = _typeFromMirror(t);
    var res = type != null ? [type] : [];
    res.addAll(p.metadata.map((m) => m.reflectee));
    return res;
  }

  List annotations(typeOrFunc) {
    final meta = typeOrFunc is Type
        ? _constructorMetadata(typeOrFunc)
        : _functionMetadata(typeOrFunc);

    return meta.map((m) => m.reflectee).toList();
  }

  Map propMetadata(typeOrFunc) {
    final res = {};
    reflectClass(typeOrFunc).declarations.forEach((k, v) {
      var name = _normalizeName(MirrorSystem.getName(k));
      if (res[name] == null) res[name] = [];
      res[name].addAll(v.metadata.map((fm) => fm.reflectee));
    });
    return res;
  }

  String _normalizeName(String name) {
    return name.endsWith("=") ? name.substring(0, name.length - 1) : name;
  }

  bool hasLifecycleHook(dynamic type, Type lcInterface, String lcProperty) {
    if (type is! Type) return false;
    return this.interfaces(type).contains(lcInterface);
  }

  List interfaces(type) {
    final clazz = reflectType(type);
    _assertDeclaresLifecycleHooks(clazz);
    return _interfacesFromMirror(clazz);
  }

  List _interfacesFromMirror(classMirror) {
    return classMirror.superinterfaces.map((si) => si.reflectedType).toList()
      ..addAll(classMirror.superclass == null
          ? []
          : _interfacesFromMirror(classMirror.superclass));
  }

  GetterFn getter(String name) {
    var symbol = new Symbol(name);
    return (receiver) => reflect(receiver).getField(symbol).reflectee;
  }

  SetterFn setter(String name) {
    var symbol = new Symbol(name);
    return (receiver, value) =>
        reflect(receiver).setField(symbol, value).reflectee;
  }

  MethodFn method(String name) {
    var symbol = new Symbol(name);
    return (receiver, posArgs) =>
        reflect(receiver).invoke(symbol, posArgs).reflectee;
  }

  List _functionParameters(Function func) {
    var closureMirror = reflect(func);
    return closureMirror.function.parameters;
  }

  List _constructorParameters(Type type) {
    ClassMirror classMirror = reflectType(type);
    MethodMirror ctor = classMirror.declarations[classMirror.simpleName];
    return ctor.parameters;
  }

  List _functionMetadata(Function func) {
    var closureMirror = reflect(func);
    return closureMirror.function.metadata;
  }

  List _constructorMetadata(Type type) {
    ClassMirror classMirror = reflectType(type);
    return classMirror.metadata;
  }

  String importUri(dynamic type) {
    // StaticSymbol
    if (type is Map && type['filePath'] != null) {
      return type['filePath'];
    }
    // Runtime type
    return '${(reflectClass(type).owner as LibraryMirror).uri}';
  }
}

final _lifecycleHookMirrors = <ClassMirror>[
  reflectType(AfterContentChecked),
  reflectType(AfterContentInit),
  reflectType(AfterViewChecked),
  reflectType(AfterViewInit),
  reflectType(DoCheck),
  reflectType(OnChanges),
  reflectType(OnDestroy),
  reflectType(OnInit),
];

/// Checks whether [clazz] implements lifecycle ifaces without declaring them.
///
/// Due to Dart implementation details, lifecycle hooks are only called when a
/// class explicitly declares that it implements the associated interface.
/// See https://goo.gl/b07Kii for details.
void _assertDeclaresLifecycleHooks(ClassMirror clazz) {
  final missingDeclarations = <ClassMirror>[];
  for (var iface in _lifecycleHookMirrors) {
    if (!_checkDeclares(clazz, iface: iface) &&
        _checkImplements(clazz, iface: iface)) {
      missingDeclarations.add(iface);
    }
  }
  if (missingDeclarations.isNotEmpty) {
    throw new MissingInterfaceError(clazz, missingDeclarations);
  }
}

/// Returns whether [clazz] declares that it implements [iface].
///
/// Returns `false` if [clazz] implements [iface] but does not declare it.
/// Returns `false` if [clazz]'s superclass declares that it
/// implements [iface].
bool _checkDeclares(ClassMirror clazz, {ClassMirror iface: null}) {
  if (iface == null) {
    throw new ArgumentError.notNull('iface');
  }
  return clazz.superinterfaces.contains(iface);
}

/// Returns whether [clazz] implements [iface].
///
/// Returns `true` if [clazz] implements [iface] and does not declare it.
/// Returns `true` if [clazz]'s superclass implements [iface].
///
/// This is an approximation of a JavaScript feature check:
/// ```js
/// var matches = true;
/// for (var prop in iface) {
///   if (iface.hasOwnProperty(prop)) {
///     matches = matches && clazz.hasOwnProperty(prop);
///   }
/// }
/// return matches;
/// ```
bool _checkImplements(ClassMirror clazz, {ClassMirror iface: null}) {
  if (iface == null) {
    throw new ArgumentError.notNull('iface');
  }

  var matches = true;
  iface.declarations.forEach((symbol, declarationMirror) {
    if (!matches) return;
    if (declarationMirror.isConstructor || declarationMirror.isPrivate) return;
    matches = clazz.declarations.keys.contains(symbol);
  });
  if (!matches && clazz.superclass != null) {
    matches = _checkImplements(clazz.superclass, iface: iface);
  }
  if (!matches && clazz.mixin != clazz) {
    matches = _checkImplements(clazz.mixin, iface: iface);
  }

  return matches;
}

/// Error thrown when a class implements a lifecycle iface it does not declare.
class MissingInterfaceError extends Error {
  final ClassMirror clazz;
  final List<ClassMirror> missingDeclarations;

  MissingInterfaceError(this.clazz, this.missingDeclarations);

  @override
  String toString() {
    final buf = new StringBuffer();
    buf.write('${clazz.simpleName} implements ');
    if (missingDeclarations.length == 1) {
      buf.write('an interface but does not declare it: ');
    } else {
      buf.write('interfaces but does not declare them: ');
    }
    buf.write(
        missingDeclarations.map((d) => d.simpleName.toString()).join(', '));
    buf.write('. See https://goo.gl/b07Kii for more info.');
    return buf.toString();
  }
}
