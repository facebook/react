library angular2.test.transform.common.annotation_matcher_test;

import 'package:test/test.dart';

import 'package:angular2/src/core/render/api.dart';
import 'package:angular2/src/compiler/compile_metadata.dart';
import 'package:angular2/src/transform/common/ng_meta.dart';

main() => allTests();

void allTests() {
  var mockDirMetadata = [
    CompileDirectiveMetadata.create(type: new CompileTypeMetadata(name: 'N1')),
    CompileDirectiveMetadata.create(type: new CompileTypeMetadata(name: 'N2')),
    CompileDirectiveMetadata.create(type: new CompileTypeMetadata(name: 'N3')),
    CompileDirectiveMetadata.create(type: new CompileTypeMetadata(name: 'N4'))
  ];

  test('should allow empty data.', () {
    var ngMeta = new NgMeta.empty();
    expect(ngMeta.isEmpty, isTrue);
  });

  group('serialization', () {
    test('should parse empty data correctly.', () {
      var ngMeta = new NgMeta.fromJson({});
      expect(ngMeta.isEmpty, isTrue);
    });

    test('should be lossless', () {
      var a = new NgMeta.empty();
      a.identifiers['T0'] = mockDirMetadata[0];
      a.identifiers['T1'] = mockDirMetadata[1];
      a.identifiers['T2'] = mockDirMetadata[2];
      a.identifiers['T3'] = mockDirMetadata[3];

      a.aliases['a1'] = ['T1'];
      a.aliases['a2'] = ['a1'];
      a.aliases['a3'] = ['T3', 'a2'];
      a.aliases['a4'] = ['a3', 'T3'];

      _checkSimilar(a, new NgMeta.fromJson(a.toJson()));
    });
  });

  group('flatten', () {
    test('should include recursive aliases.', () {
      var a = new NgMeta.empty();
      a.identifiers['T0'] = mockDirMetadata[0];
      a.identifiers['T1'] = mockDirMetadata[1];
      a.identifiers['T2'] = mockDirMetadata[2];
      a.identifiers['T3'] = mockDirMetadata[3];
      a.aliases['a1'] = ['T1'];
      a.aliases['a2'] = ['a1'];
      a.aliases['a3'] = ['T3', 'a2'];
      a.aliases['a4'] = ['a3', 'T0'];

      expect(a.flatten('a4'),
          equals([mockDirMetadata[3], mockDirMetadata[1], mockDirMetadata[0]]));
    });

    test('should detect cycles.', () {
      var a = new NgMeta.empty();
      a.identifiers['T0'] = mockDirMetadata[0];
      a.aliases['a1'] = ['T0', 'a2'];
      a.aliases['a2'] = ['a1'];

      expect(
          () => a.flatten('a1'),
          throwsA(predicate((ex) =>
              new RegExp('Cycle: a1 -> a2 -> a1.').hasMatch(ex.message))));
    });

    test('should allow duplicates.', () {
      var a = new NgMeta.empty();
      a.identifiers['T0'] = mockDirMetadata[0];
      a.aliases['a1'] = ['T0', 'a2'];
      a.aliases['a2'] = ['T0'];

      expect(() => a.flatten('a1'), returnsNormally);
    });
  });

  group('merge', () {
    test('should merge all identifiers on addAll', () {
      var a = new NgMeta.empty();
      var b = new NgMeta.empty();
      a.identifiers['T0'] = mockDirMetadata[0];
      b.identifiers['T1'] = mockDirMetadata[1];
      a.addAll(b);
      expect(a.identifiers, contains('T1'));
      expect(a.identifiers['T1'], equals(mockDirMetadata[1]));
    });

    test('should merge all aliases on addAll', () {
      var a = new NgMeta.empty();
      var b = new NgMeta.empty();
      a.aliases['a'] = ['x'];
      b.aliases['b'] = ['y'];
      a.addAll(b);
      expect(a.aliases, contains('b'));
      expect(a.aliases['b'], equals(['y']));
    });
  });

  group('needsResolution', () {
    test('should be true if there is a provider', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = new CompileIdentifierMetadata(name: 'MyIdentifier', value: new CompileProviderMetadata());
      expect(a.needsResolution, isTrue);
    });

    test('should be true if there is an injectable service', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = new CompileTypeMetadata();
      expect(a.needsResolution, isTrue);
    });

    test('should be true if there is an directive', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = new CompileDirectiveMetadata();
      expect(a.needsResolution, isTrue);
    });

    test('should be true if there is a pipe', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = new CompilePipeMetadata();
      expect(a.needsResolution, isTrue);
    });

    test('should be true if there is a factory', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = new CompileFactoryMetadata();
      expect(a.needsResolution, isTrue);
    });

    test('should be false otherwise', () {
      var a = new NgMeta.empty();
      a.identifiers["MyIdentifier"] = "some value";
      expect(a.needsResolution, isFalse);
    });
  });
}

_checkSimilar(NgMeta a, NgMeta b) {
  expect(a.identifiers.length, equals(b.identifiers.length));
  expect(a.aliases.length, equals(b.aliases.length));
  for (var k in a.identifiers.keys) {
    expect(b.identifiers, contains(k));
    var at = a.identifiers[k];
    var bt = b.identifiers[k];
    expect(at.type.name, equals(bt.type.name));
  }
  for (var k in a.aliases.keys) {
    expect(b.aliases, contains(k));
    expect(b.aliases[k], equals(a.aliases[k]));
  }
}
