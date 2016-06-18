library angular2.test.transform.common.code.ng_deps_code_tests;

import 'package:analyzer/analyzer.dart';
import 'package:test/test.dart';

import 'package:angular2/src/transform/common/code/ng_deps_code.dart';
import 'package:angular2/src/transform/common/model/import_export_model.pb.dart';
import 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';

main() => allTests();

void allTests() {
  group('writeNgDepsModel', () {
    test('should output parsable code', () async {
      final ngDeps = new NgDepsModel()
        ..libraryUri = 'test.foo'
        ..imports.add(new ImportModel()
          ..uri = 'bar.dart'
          ..prefix = 'dep');

      final buf = new StringBuffer();
      final writer = new NgDepsWriter(buf);
      writer.writeNgDepsModel(ngDeps, '');

      var compilationUnit = parseCompilationUnit(buf.toString());

      expect(compilationUnit, isNotNull);
      expect(compilationUnit.declarations, isNotNull);
      expect(compilationUnit.declarations.length > 0, isTrue);
    });

    test('should output parsable code with deferred imports', () async {
      // Regression test for i/4587.
      final ngDeps = new NgDepsModel()
        ..libraryUri = 'test.foo'
        ..imports.add(new ImportModel()
          ..uri = 'bar.dart'
          ..isDeferred = true
          ..prefix = 'dep');

      final buf = new StringBuffer();
      final writer = new NgDepsWriter(buf);
      writer.writeNgDepsModel(ngDeps, '');

      var compilationUnit = parseCompilationUnit(buf.toString());

      expect(compilationUnit, isNotNull);
      expect(compilationUnit.declarations, isNotNull);
      expect(compilationUnit.declarations.length > 0, isTrue);
    });

    test('should add the given templateSource', () async {
      final ngDeps = new NgDepsModel()
        ..libraryUri = 'test.foo'
        ..imports.add(new ImportModel()
          ..uri = 'bar.dart'
          ..prefix = 'dep');

      final buf = new StringBuffer();
      final writer = new NgDepsWriter(buf);
      writer.writeNgDepsModel(ngDeps, 'import \'foo.dart\';\nvar x = true;');

      var compilationUnit = parseCompilationUnit(buf.toString());

      expect(compilationUnit, isNotNull);
      expect(compilationUnit.declarations, isNotNull);
      expect(compilationUnit.declarations.length > 0, isTrue);
    });
  });
}
