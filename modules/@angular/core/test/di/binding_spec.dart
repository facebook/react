/// This file contains tests that make sense only in Dart world, such as
/// verifying that things are valid constants.
library angular2.test.di.binding_dart_spec;

import 'dart:mirrors';
import 'package:@angular/core/testing/testing_internal.dart';
import 'package:angular2/core.dart';

main() {
  describe('Binding', () {
    it('can create constant from token', () {
      expect(const Binding(Foo).token).toBe(Foo);
    });

    it('can create constant from class', () {
      expect(const Binding(Foo, toClass: Bar).toClass).toBe(Bar);
    });

    it('can create constant from value', () {
      expect(const Binding(Foo, toValue: 5).toValue).toBe(5);
    });

    it('can create constant from alias', () {
      expect(const Binding(Foo, toAlias: Bar).toAlias).toBe(Bar);
    });

    it('can create constant from factory', () {
      expect(const Binding(Foo, toFactory: fn).toFactory).toBe(fn);
    });

    it('can be used in annotation', () {
      ClassMirror mirror = reflectType(Annotated);
      var bindings = mirror.metadata[0].reflectee.bindings;
      expect(bindings.length).toBe(5);
      bindings.forEach((b) {
        expect(b).toBeA(Binding);
      });
    });
  });
}

class Foo {}

class Bar extends Foo {}

fn() => null;

class Annotation {
  final List bindings;
  const Annotation(this.bindings);
}

@Annotation(const [
  const Binding(Foo),
  const Binding(Foo, toClass: Bar),
  const Binding(Foo, toValue: 5),
  const Binding(Foo, toAlias: Bar),
  const Binding(Foo, toFactory: fn)
])
class Annotated {}
