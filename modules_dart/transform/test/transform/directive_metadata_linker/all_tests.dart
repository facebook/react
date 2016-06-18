library angular2.test.transform.directive_metadata_linker.all_tests;

import 'dart:async';
import 'dart:convert';

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';
import 'package:test/test.dart';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/model/import_export_model.pb.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/src/transform/directive_metadata_linker/ng_meta_linker.dart';

import '../common/ng_meta_helper.dart';
import '../common/read_file.dart';
import '../common/recording_logger.dart';

var formatter = new DartFormatter();

main() => allTests();

var oldTest = test;
void allTests() {
  var test = (name, fn) {
//    if (name.contains('indirection')) {
      oldTest(name, fn);
//    }
  };

  TestAssetReader reader = null;
  final moduleBase = 'asset:a';
  var fooNgMeta, fooAssetId, fooMetaAssetId, fooComponentMeta;
  var barNgMeta, barAssetId, barMetaAssetId, barComponentMeta;
  var bazNgMeta, bazAssetId, bazMetaAssetId, bazComponentMeta;

  /// Call after making changes to `fooNgMeta`, `barNgMeta`, or `bazNgMeta` and
  /// before trying to read them from `reader`.
  final updateReader = () => reader
    ..addAsset(fooAssetId, JSON.encode(fooNgMeta.toJson()))
    ..addAsset(barMetaAssetId, JSON.encode(fooNgMeta.toJson()))
    ..addAsset(barAssetId, JSON.encode(barNgMeta.toJson()))
    ..addAsset(barMetaAssetId, JSON.encode(barNgMeta.toJson()))
    ..addAsset(bazAssetId, JSON.encode(bazNgMeta.toJson()))
    ..addAsset(bazMetaAssetId, JSON.encode(bazNgMeta.toJson()));

  setUp(() {
    reader = new TestAssetReader();

    // Establish some test NgMeta objects with one Component each.
    fooComponentMeta = createFoo(moduleBase);
    fooNgMeta = new NgMeta(ngDeps: new NgDepsModel());
    fooNgMeta.identifiers[fooComponentMeta.type.name] = fooComponentMeta;

    barComponentMeta = createBar(moduleBase);
    barNgMeta = new NgMeta(ngDeps: new NgDepsModel());
    barNgMeta.identifiers[barComponentMeta.type.name] = barComponentMeta;

    bazComponentMeta = createBaz(moduleBase);
    bazNgMeta = new NgMeta(ngDeps: new NgDepsModel());
    barNgMeta.identifiers[bazComponentMeta.type.name] = bazComponentMeta;

    fooAssetId = new AssetId('a', toSummaryExtension('lib/foo.dart'));
    fooMetaAssetId = new AssetId('a', toMetaExtension('lib/foo.dart'));
    barAssetId = new AssetId('a', toSummaryExtension('lib/bar.dart'));
    barMetaAssetId = new AssetId('a', toMetaExtension('lib/bar.dart'));
    bazAssetId = new AssetId('a', toSummaryExtension('lib/baz.dart'));
    bazMetaAssetId = new AssetId('a', toMetaExtension('lib/baz.dart'));

    updateReader();
  });

  group('NgMeta linker', () {
    test('should include `DirectiveMetadata` from exported files.', () async {
      fooNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'bar.dart');
      updateReader();

      var extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      expect(extracted.identifiers['FooComponent'], isNotNull);
      expect(extracted.identifiers['BarComponent'], isNotNull);

      expect(extracted.identifiers['FooComponent'].selector, equals('foo'));
      expect(extracted.identifiers['BarComponent'].selector, equals('bar'));
    });

    test('should include `DirectiveMetadata` recursively from exported files.',
        () async {
      fooNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'bar.dart');
      barNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'baz.dart');
      updateReader();

      var extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      expect(extracted.identifiers['FooComponent'], isNotNull);
      expect(extracted.identifiers['BarComponent'], isNotNull);
      expect(extracted.identifiers['BazComponent'], isNotNull);

      expect(extracted.identifiers['FooComponent'].selector, equals('foo'));
      expect(extracted.identifiers['BarComponent'].selector, equals('bar'));
      expect(extracted.identifiers['BazComponent'].selector, equals('baz'));
    });

    test('should handle `DirectiveMetadata` export cycles gracefully.', () async {
      fooNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'bar.dart');
      barNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'baz.dart');
      bazNgMeta.ngDeps.exports.add(new ExportModel()..uri = 'foo.dart');
      updateReader();

      var extracted = await _testLink(reader, bazAssetId, bazMetaAssetId);
      expect(extracted.identifiers['FooComponent'], isNotNull);
      expect(extracted.identifiers['BarComponent'], isNotNull);
      expect(extracted.identifiers['BazComponent'], isNotNull);
    });

    test('should include `DirectiveMetadata` from exported files '
            'expressed as absolute uris', () async {
      fooNgMeta.ngDeps.exports
          .add(new ExportModel()..uri = 'package:bar/bar.dart');
      updateReader();
      reader.addAsset(new AssetId('bar', toMetaExtension('lib/bar.dart')),
          JSON.encode(barNgMeta.toJson()));

      var extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);

      expect(extracted.identifiers['FooComponent'], isNotNull);
      expect(extracted.identifiers['BarComponent'], isNotNull);

      expect(extracted.identifiers['FooComponent'].selector, equals('foo'));
      expect(extracted.identifiers['BarComponent'].selector, equals('bar'));
    });

    test('should resolve queries from types.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooComponentMeta.queries = [
        new CompileQueryMetadata(selectors: [new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))],
            read: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))),
        new CompileQueryMetadata(selectors: [new CompileTokenMetadata(value: 'one')],
            read: new CompileTokenMetadata(value: 'one'))
      ];

      fooComponentMeta.viewQueries = [
        new CompileQueryMetadata(selectors: [new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))],
            read: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))),
        new CompileQueryMetadata(selectors: [new CompileTokenMetadata(value: 'one')],
            read: new CompileTokenMetadata(value: 'one'))
      ];

      fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.queries.length, equals(2));
      expect(cmp.viewQueries.length, equals(2));

      expect(cmp.queries[0].selectors[0].identifier.name, equals("Service"));
      expect(cmp.queries[0].selectors[0].identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.queries[0].read.identifier.name, equals("Service"));
      expect(cmp.queries[0].read.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.queries[1].selectors[0].value, equals("one"));
      expect(cmp.queries[1].read.value, equals("one"));

      expect(cmp.viewQueries[0].selectors[0].identifier.name, equals("Service"));
      expect(cmp.viewQueries[0].selectors[0].identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.viewQueries[0].read.identifier.name, equals("Service"));
      expect(cmp.viewQueries[0].read.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.viewQueries[1].selectors[0].value, equals("one"));
      expect(cmp.viewQueries[1].read.value, equals("one"));
    });

    test('should resolve providers from types.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooComponentMeta.providers = [
        new CompileIdentifierMetadata(name: 'Service')
      ];
      fooComponentMeta.type.diDeps = [
        new CompileDiDependencyMetadata(
            token: new CompileTokenMetadata(identifier:
                new CompileIdentifierMetadata(name: 'Service')))
      ];

      fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));

      expect(cmp.providers[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[0].useClass.identifier.name, equals("Service"));
      expect(cmp.providers[0].useClass.identifier.moduleUrl, equals("moduleUrl"));

      expect(cmp.type.diDeps.length, equals(1));
      expect(cmp.type.diDeps[0].token.identifier.name, equals("Service"));
      expect(cmp.type.diDeps[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve providers from functions.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooNgMeta.identifiers['factory'] =
      new CompileFactoryMetadata(name: 'factory', moduleUrl: 'moduleUrl', diDeps: [
        new CompileDiDependencyMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service')))
      ]);

      fooComponentMeta.providers = [
        new CompileProviderMetadata(token: new CompileTokenMetadata(value: 'someFunc'), useFactory:
          new CompileFactoryMetadata(name: 'factory'))
      ];

      fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));

      expect(cmp.providers[0].token.value, equals("someFunc"));
      expect(cmp.providers[0].useFactory.name, equals("factory"));
      expect(cmp.providers[0].useFactory.moduleUrl, equals("moduleUrl"));

      expect(cmp.providers[0].useFactory.diDeps[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].useFactory.diDeps[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve viewProviders from types.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooComponentMeta.viewProviders = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service')))
      ];
      fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.viewProviders.length, equals(1));
      expect(cmp.viewProviders[0].token.identifier.name, equals("Service"));
      expect(cmp.viewProviders[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve providers from Provider objects (literals).', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooComponentMeta.template =
      new CompileTemplateMetadata(template: "import 'bar.dart';");
      fooComponentMeta.providers = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(value: "StrService"),
            useClass: new CompileTypeMetadata(name: 'Service'))
      ];
      fooComponentMeta.type.diDeps = [
        new CompileDiDependencyMetadata(token: new CompileTokenMetadata(value: "StrService"))
      ];

      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));

      expect(cmp.providers[0].token.value, equals("StrService"));
      expect(cmp.providers[0].useClass.name, equals("Service"));
      expect(cmp.providers[0].useClass.moduleUrl, equals("moduleUrl"));

      expect(cmp.type.diDeps.length, equals(1));
      expect(cmp.type.diDeps[0].token.value, equals("StrService"));
    });

    test('should resolve providers from references', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooNgMeta.identifiers["PROVIDER"] = new CompileIdentifierMetadata(
          name: 'PROVIDER',
          value: new CompileProviderMetadata(
              token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))));

      fooComponentMeta.providers = [
        new CompileIdentifierMetadata(name: 'PROVIDER')
      ];
      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));
      expect(cmp.providers[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve providers from lists.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooNgMeta.identifiers["PROVIDERS"] = new CompileIdentifierMetadata(name: 'PROVIDERS',
          value: [
            new CompileIdentifierMetadata(name: "Service")
          ]);

      fooComponentMeta.providers = [
        new CompileIdentifierMetadata(name: 'PROVIDERS')
      ];
      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));
      expect(cmp.providers[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve providers from lists (two lists in the same file).', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');


      fooNgMeta.identifiers["OUTER_PROVIDERS"] = new CompileIdentifierMetadata(name: 'PROVIDERS',
          value: [
            new CompileIdentifierMetadata(name: "INNER_PROVIDERS")
          ]);

      fooNgMeta.identifiers["INNER_PROVIDERS"] = new CompileIdentifierMetadata(name: 'PROVIDERS',
          value: [
            new CompileIdentifierMetadata(name: "Service")
          ]);

      fooComponentMeta.providers = [
        new CompileIdentifierMetadata(name: 'OUTER_PROVIDERS')
      ];
      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));
      expect(cmp.providers[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve providers when there is a level of indirection.', () async {
      bazNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      barNgMeta.identifiers['BAR_PROVIDERS'] = new CompileIdentifierMetadata(name: 'BAR_PROVIDERS',
          moduleUrl: 'moduleUrl',
          value: [
            new CompileIdentifierMetadata(name: "Service")
          ]);
      barNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/baz.dart');


      fooNgMeta.identifiers["PROVIDERS"] = new CompileIdentifierMetadata(name: 'PROVIDERS', moduleUrl: 'moduleUrl',
          value: new CompileIdentifierMetadata(name: 'BAR_PROVIDERS'));
      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');
      fooComponentMeta.providers = [new CompileIdentifierMetadata(name: 'PROVIDERS')];

      reader.clear();
      reader
        ..addAsset(fooAssetId, JSON.encode(fooNgMeta.toJson()))
        ..addAsset(barAssetId, JSON.encode(barNgMeta.toJson()))
        ..addAsset(bazAssetId, JSON.encode(bazNgMeta.toJson()));

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));
      expect(cmp.providers[0].token.identifier.name, equals("Service"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should generate generate diDeps of injectable services.', () async {
      fooNgMeta.identifiers['Service2'] =
      new CompileTypeMetadata(name: 'Service2', moduleUrl: 'moduleUrl');

      fooNgMeta.identifiers['Service'] = new CompileTypeMetadata(
          name: 'Service',
          moduleUrl: 'moduleUrl',
          diDeps: [
            new CompileDiDependencyMetadata(
                token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service2')))
          ]);

      fooComponentMeta.providers = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service')),
            useClass: new CompileTypeMetadata(name: 'Service'))
      ];

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));

      expect(cmp.providers[0].useClass.name, equals("Service"));
      expect(cmp.providers[0].useClass.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[0].useClass.diDeps.first.token.identifier.name, equals("Service2"));
      expect(cmp.providers[0].useClass.diDeps.first.token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve queries and viewQueries.', () async {
      barNgMeta.identifiers['Service'] =
      new CompileTypeMetadata(name: 'Service', moduleUrl: 'moduleUrl');

      fooComponentMeta.template =
      new CompileTemplateMetadata(template: "import 'bar.dart';");
      fooComponentMeta.type.diDeps = [
        new CompileDiDependencyMetadata(
            token: new CompileTokenMetadata(value: 'someToken'),
            query: new CompileQueryMetadata(
                selectors: [new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))])),
        new CompileDiDependencyMetadata(
            token: new CompileTokenMetadata(value: 'someToken'),
            viewQuery: new CompileQueryMetadata(
                selectors: [new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service'))]))
      ];

      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.type.diDeps.length, equals(2));

      expect(cmp.type.diDeps[0].query.selectors[0].identifier.name, equals("Service"));
      expect(cmp.type.diDeps[0].query.selectors[0].identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.type.diDeps[1].viewQuery.selectors[0].identifier.name, equals("Service"));
      expect(cmp.type.diDeps[1].viewQuery.selectors[0].identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should generate providers from Provider objects (references).',
        () async {
      barNgMeta.identifiers['Service1'] =
      new CompileTypeMetadata(name: 'Service1', moduleUrl: 'moduleUrl');
      barNgMeta.identifiers['Service2'] =
      new CompileTypeMetadata(name: 'Service2', moduleUrl: 'moduleUrl');
      barNgMeta.identifiers['factory'] =
      new CompileFactoryMetadata(name: 'factory', moduleUrl: 'moduleUrl', diDeps: [
        new CompileDiDependencyMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service2', moduleUrl: 'moduleUrl')))
      ]);

      fooComponentMeta.template =
      new CompileTemplateMetadata(template: "import 'bar.dart';");
      fooComponentMeta.providers = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')),
            useClass: new CompileTypeMetadata(name: 'Service2')),
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')),
            useExisting: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service2'))),
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')),
            useValue: new CompileIdentifierMetadata(name: 'Service2')),
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')),
            useFactory: new CompileFactoryMetadata(name: 'factory'))
      ];

      fooNgMeta.ngDeps.imports
          .add(new ImportModel()..uri = 'package:a/bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(4));

      expect(cmp.providers[0].token.identifier.name, equals("Service1"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[0].useClass.name, equals("Service2"));
      expect(cmp.providers[0].useClass.moduleUrl, equals("moduleUrl"));

      expect(cmp.providers[1].token.identifier.name, equals("Service1"));
      expect(cmp.providers[1].token.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[1].useExisting.identifier.name, equals("Service2"));
      expect(cmp.providers[1].useExisting.identifier.moduleUrl, equals("moduleUrl"));

      expect(cmp.providers[2].token.identifier.name, equals("Service1"));
      expect(cmp.providers[2].token.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[2].useValue.name, equals("Service2"));
      expect(cmp.providers[2].useValue.moduleUrl, equals("moduleUrl"));

      expect(cmp.providers[3].token.identifier.name, equals("Service1"));
      expect(cmp.providers[3].token.identifier.moduleUrl, equals("moduleUrl"));
      expect(cmp.providers[3].useFactory.name, equals("factory"));
      expect(cmp.providers[3].useFactory.moduleUrl, equals("moduleUrl"));
    });

    test('should fallback to the list of resolved identifiers.', () async {
      fooNgMeta.identifiers['Service2'] =
      new CompileTypeMetadata(name: 'Service2', moduleUrl: 'moduleUrl');

      fooComponentMeta.providers = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')),
            useClass: new CompileTypeMetadata(name: 'Service2'))
      ];

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId,
          {"Service1": "someModuleUrl", "Service2": "someModuleUrl"});
      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));

      expect(cmp.providers[0].token.identifier.name, equals("Service1"));
      expect(cmp.providers[0].token.identifier.moduleUrl, equals("someModuleUrl"));
      expect(cmp.providers[0].useClass.name, equals("Service2"));
      expect(cmp.providers[0].useClass.moduleUrl, equals("moduleUrl"));
    });

    test('should resolve circular references.', () async {
      barNgMeta.identifiers['Service1'] =
      new CompileTypeMetadata(name: 'Service1', moduleUrl: 'moduleUrl',
          diDeps: [new CompileDiDependencyMetadata(token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: "Service2")))]);
      barNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'foo.dart');

      fooNgMeta.identifiers['Service2'] =
      new CompileTypeMetadata(name: 'Service2', moduleUrl: 'moduleUrl',
          diDeps: [new CompileDiDependencyMetadata(token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: "Service1")))]);
      fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

      updateReader();

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);
      final service2 = extracted.identifiers["Service2"];

      expect(service2.diDeps[0].token.identifier.name, equals("Service1"));
      expect(service2.diDeps[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should link dependencies (imports and exports first).', () async {
      bazNgMeta.identifiers['Service2'] =
      new CompileTypeMetadata(name: 'Service2', moduleUrl: 'moduleUrl');

      barNgMeta.identifiers['Service1'] = new CompileTypeMetadata(
          name: 'Service1',
          moduleUrl: 'moduleUrl',
          diDeps: [
            new CompileDiDependencyMetadata(
                token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service2')))
          ]);
      barNgMeta.ngDeps..imports.add(new ImportModel()..uri = 'baz.dart');

      fooComponentMeta.providers = [
        new CompileProviderMetadata(
            token: new CompileTokenMetadata(identifier: new CompileIdentifierMetadata(name: 'Service1')))
      ];
      fooNgMeta.ngDeps..imports.add(new ImportModel()..uri = 'bar.dart');

      reader.clear();
      reader
        ..addAsset(fooAssetId, JSON.encode(fooNgMeta.toJson()))
        ..addAsset(barAssetId, JSON.encode(barNgMeta.toJson()))
        ..addAsset(bazAssetId, JSON.encode(bazNgMeta.toJson()));

      final extracted = await _testLink(reader, fooAssetId, fooMetaAssetId);

      final cmp = extracted.identifiers["FooComponent"];

      expect(cmp.providers.length, equals(1));
      final firstProvider = cmp.providers[0];

      expect(firstProvider.token.identifier.diDeps[0].token.identifier.name, equals("Service2"));
      expect(firstProvider.token.identifier.diDeps[0].token.identifier.moduleUrl, equals("moduleUrl"));
    });

    test('should not resolve when not needed', () async {
      fooNgMeta.identifiers['SomeId'] = new CompileIdentifierMetadata(name: 'SomeId');
      fooNgMeta.ngDeps..imports.add(new ImportModel()..uri = 'bar.dart');

      fooNgMeta.identifiers.clear();
      reader.clear();
      // there is no bar, so it should throw when trying to resolve
      reader
        ..addAsset(fooAssetId, JSON.encode(fooNgMeta.toJson()))
        ..addAsset(barAssetId, "Invalid");

      await _testLink(reader, fooAssetId, fooMetaAssetId);
    });
  });

  group('NgDeps linker', () {
    test('should chain imported dependencies.', () async {
      fooNgMeta.ngDeps
        ..libraryUri = 'test.foo'
        ..imports.add(new ImportModel()
          ..uri = 'bar.dart'
          ..prefix = 'dep');
      barNgMeta.ngDeps.libraryUri = 'test.bar';
      updateReader();

      var linked = (await _testLink(reader, fooAssetId, fooMetaAssetId)).ngDeps;
      expect(linked, isNotNull);
      var linkedImport = linked.depImports
          .firstWhere((i) => i.uri.endsWith('bar.ngfactory.dart'));
      expect(linkedImport, isNotNull);
      expect(linkedImport.prefix.startsWith('i'), isTrue);
    });

    test('should chain exported dependencies.', () async {
      fooNgMeta.ngDeps
        ..libraryUri = 'test.foo'
        ..exports.add(new ExportModel()..uri = 'bar.dart');
      barNgMeta.ngDeps.libraryUri = 'test.bar';
      updateReader();

      var linked = (await _testLink(reader, fooAssetId, fooMetaAssetId)).ngDeps;
      expect(linked, isNotNull);
      var linkedImport = linked.depImports
          .firstWhere((i) => i.uri.endsWith('bar.ngfactory.dart'));
      expect(linkedImport, isNotNull);
      expect(linkedImport.prefix.startsWith('i'), isTrue);
    });

    test('should not chain `deferred` libraries.', () async {
      fooNgMeta.ngDeps
        ..libraryUri = 'test.foo'
        ..imports.add(new ImportModel()
          ..uri = 'bar.dart'
          ..isDeferred = true
          ..prefix = 'dep');
      barNgMeta.ngDeps.libraryUri = 'test.bar';
      updateReader();

      var linked = (await _testLink(reader, fooAssetId, fooMetaAssetId)).ngDeps;
      expect(linked, isNotNull);
      var linkedImport = linked.depImports.firstWhere(
          (i) => i.uri.endsWith('bar.ngfactory.dart'),
          orElse: () => null);
      expect(linkedImport, isNull);
    });
  });
}

Future<NgMeta> _testLink(
    AssetReader reader, AssetId summaryAssetId, AssetId metaAssetId,
    [Map<String, String> resolvedIdentifiers]) {
  return zone.exec(
      () => linkDirectiveMetadata(
      reader, summaryAssetId, metaAssetId, resolvedIdentifiers),
      log: new RecordingLogger());
}
