library angular2.test.transform.template_compiler.all_tests;

import 'dart:async';
import 'dart:convert';

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';
import 'package:path/path.dart' as path;
import 'package:guinness/guinness.dart';

import 'package:angular2/src/platform/server/html_adapter.dart';
import 'package:angular2/src/transform/common/code/ng_deps_code.dart';
import 'package:angular2/src/transform/common/code/source_module.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/src/transform/template_compiler/generator.dart';
import 'package:angular2/src/transform/template_compiler/compile_data_creator.dart';
import 'package:angular2/i18n.dart';

import 'package:angular2/src/transform/common/model/parameter_model.pb.dart';
import '../common/compile_directive_metadata/ng_for.ng_meta.dart' as ngMeta;
import '../common/ng_meta_helper.dart';
import '../common/read_file.dart';
import '../common/recording_logger.dart';

var formatter = new DartFormatter();
TestAssetReader reader;
RecordingLogger logger;
const CONTEXT_ACCESSOR = 'context';

main() => allTests();

var fooComponentMeta, fooNgMeta, fooAssetId;
var barComponentMeta, barPipeMeta, barNgMeta, barAssetId;
var bazComponentMeta, bazNgMeta, bazAssetId;

/// Call after making changes to `fooNgMeta`, `barNgMeta`, or `bazNgMeta` and
/// before trying to read them from `reader`.
TestAssetReader updateReader() => reader
  ..addAsset(fooAssetId, JSON.encode(fooNgMeta.toJson()))
  ..addAsset(barAssetId, JSON.encode(barNgMeta.toJson()))
  ..addAsset(bazAssetId, JSON.encode(bazNgMeta.toJson()));

void allTests() {
  Html5LibDomAdapter.makeCurrent();

  final moduleBase = 'asset:a';

  beforeEach(() {
    reader = new TestAssetReader()
      ..addAsset(
          new AssetId('angular2', 'lib/src/directives/ng_for.ng_meta.json'),
          JSON.encode(ngMeta.ngFor));

    // Establish some test NgMeta objects with one Component each.
    // NOTE(kegluneq): For simplicity, the NgDepsModel objects created here are
    // lacking some details that would be created by DirectiveProcessor but
    // which are not used in the template compiler.
    fooComponentMeta = createFoo(moduleBase);
    fooNgMeta = new NgMeta(
        ngDeps: new NgDepsModel()
          ..libraryUri = 'test.foo'
          ..reflectables.add(
              new ReflectionInfoModel()..name = fooComponentMeta.type.name));
    fooNgMeta.identifiers[fooComponentMeta.type.name] = fooComponentMeta;

    barComponentMeta = createBar(moduleBase);
    barPipeMeta = createBarPipe(moduleBase);
    barNgMeta = new NgMeta(
        ngDeps: new NgDepsModel()
          ..libraryUri = 'test.bar'
          ..reflectables
              .add(new ReflectionInfoModel()..name = barPipeMeta.type.name)
          ..reflectables.add(
              new ReflectionInfoModel()..name = barComponentMeta.type.name));
    barNgMeta.identifiers[barComponentMeta.type.name] = barComponentMeta;
    barNgMeta.identifiers[barPipeMeta.type.name] = barPipeMeta;

    bazComponentMeta = createBaz(moduleBase);
    bazNgMeta = new NgMeta(
        ngDeps: new NgDepsModel()
          ..libraryUri = 'test.baz'
          ..reflectables.add(
              new ReflectionInfoModel()..name = bazComponentMeta.type.name));
    barNgMeta.identifiers[bazComponentMeta.type.name] = bazComponentMeta;

    fooAssetId = new AssetId('a', 'lib/foo.ng_meta.json');
    barAssetId = new AssetId('a', 'lib/bar.ng_meta.json');
    bazAssetId = new AssetId('a', 'lib/baz.ng_meta.json');
    updateReader();
  });

  Future<String> process(AssetId assetId,
      {List<String> platformDirectives, List<String> platformPipes, Map<String,String> resolvedIdentifiers,
      XmbDeserializationResult translations}) {
    logger = new RecordingLogger();
    return zone.exec(
        () => processTemplates(reader, assetId,
            platformDirectives: platformDirectives,
            platformPipes: platformPipes,
            resolvedIdentifiers: resolvedIdentifiers,
            translations: translations
            ),
        log: logger);
  }

  it('should parse simple expressions in inline templates.', () async {
    fooComponentMeta.template = new CompileTemplateMetadata(
        template: '<div [id]="b">{{greeting}}</div>',
        templateUrl: 'template.html');
    updateReader();

    final outputs = await process(fooAssetId);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(ngDeps.reflectables.first.annotations)
        .toContain(new AnnotationModel()
          ..name = 'FooComponentNgFactory'
          ..isConstObject = true);
    expect(_generatedCode(outputs))
      ..toContain('$CONTEXT_ACCESSOR.greeting')
      ..toContain('$CONTEXT_ACCESSOR.b');
  });

  it('should parse simple methods in inline templates.', () async {
    fooComponentMeta.template = new CompileTemplateMetadata(
        template: '<button (click)="action()">go</button>',
        templateUrl: 'template.html');
    updateReader();

    final outputs = await process(fooAssetId);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(ngDeps.reflectables.first.annotations)
        .toContain(new AnnotationModel()
          ..name = 'FooComponentNgFactory'
          ..isConstObject = true);
    expect(_generatedCode(outputs))..toContain('$CONTEXT_ACCESSOR.action()');
  });

  it('should parse `View` directives with a single dependency.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '<${barComponentMeta.selector}>');
    final viewAnnotation = new AnnotationModel()
      ..name = 'View';
    viewAnnotation.namedParameters.add(new NamedParameter()
      ..name = 'directives'
      ..value = 'const [${barComponentMeta.type.name}]');
    fooNgMeta.ngDeps.reflectables.first.annotations.add(viewAnnotation);
    fooNgMeta.ngDeps.reflectables.first.directives
        .add(new PrefixedType()..name = barComponentMeta.type.name);
    fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');
    barComponentMeta.template =
        new CompileTemplateMetadata(template: 'BarTemplate');
    updateReader();

    final outputs = await process(fooAssetId);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(ngDeps.reflectables.first.annotations)
        .toContain(new AnnotationModel()
          ..name = 'FooComponentNgFactory'
          ..isConstObject = true);

    expect(_generatedCode(outputs))
      ..toContain("import 'bar.dart'")
      ..toContain("import 'bar.ngfactory.dart'");
  });

  it('should parse `View` directives with a single prefixed dependency.',
      () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '<${barComponentMeta.selector}>');
    final componentAnnotation = new AnnotationModel()
      ..name = 'View';
    fooNgMeta.ngDeps.reflectables.first.annotations.add(componentAnnotation);
    fooNgMeta.ngDeps.reflectables.first.directives.add(new PrefixedType()
      ..name = barComponentMeta.type.name
      ..prefix = 'prefix');
    fooNgMeta.ngDeps.imports.add(new ImportModel()
      ..uri = 'bar.dart'
      ..prefix = 'prefix');
    barComponentMeta.template =
        new CompileTemplateMetadata(template: 'BarTemplate');
    updateReader();

    final outputs = await process(fooAssetId);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(ngDeps.reflectables.first.annotations)
        .toContain(new AnnotationModel()
          ..name = 'FooComponentNgFactory'
          ..isConstObject = true);

    expect(_generatedCode(outputs))
      ..toContain("import 'bar.dart'")
      ..toContain("import 'bar.ngfactory.dart'");
  });

  it('should include directives mentioned in directive aliases.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '<${barComponentMeta.selector}>');
    final componentAnnotation = new AnnotationModel()
      ..name = 'View';
    fooNgMeta.ngDeps.reflectables.first.annotations.add(componentAnnotation);
    fooNgMeta.ngDeps.reflectables.first.directives
        .add(new PrefixedType()..name = 'directiveAlias');
    fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');

    fooNgMeta.aliases['directiveAlias'] = [barComponentMeta.type.name];
    barComponentMeta.template =
        new CompileTemplateMetadata(template: 'BarTemplate');
    updateReader();

    final outputs = await process(fooAssetId);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(ngDeps.reflectables.first.annotations)
        .toContain(new AnnotationModel()
          ..name = 'FooComponentNgFactory'
          ..isConstObject = true);

    expect(_generatedCode(outputs))
      ..toContain("import 'bar.dart'")
      ..toContain("import 'bar.ngfactory.dart'");
  });

  it('should create the same output for multiple calls.', () async {
    fooComponentMeta.template = new CompileTemplateMetadata(
        template: '<div [id]="b">{{greeting}}</div>',
        templateUrl: 'template.html');
    updateReader();

    final firstOutputs = await process(fooAssetId);
    final secondOutputs = await process(fooAssetId);
    expect(firstOutputs.ngDeps).toEqual(secondOutputs.ngDeps);
    expect(_generatedCode(firstOutputs)).toEqual(_generatedCode(secondOutputs));
  });

  it('should gracefully handle null .ng_meta.json files', () async {
    final dne =
        new AssetId('package', 'lib/file_that_does_not_exist.ng_meta.json');

    var didThrow = false;
    await process(dne).then((out) {
      expect(out).toBeNull();
    }).catchError((_) {
      didThrow = true;
    });

    expect(didThrow).toBeFalse();
  });

  it('should gracefully handle empty .ng_meta.json files', () async {
    final emptyId = new AssetId('package', 'lib/empty.ng_meta.json');
    reader.addAsset(emptyId, '');

    var didThrow = false;
    await process(emptyId).then((out) {
      expect(out).toBeNull();
    }).catchError((_) {
      didThrow = true;
    });

    expect(didThrow).toBeFalse();
  });

  it('should include platform directives.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '<bar></bar>');
    final viewAnnotation = new AnnotationModel()
      ..name = 'View';

    barNgMeta.aliases['PLATFORM'] = [barComponentMeta.type.name];
    updateReader();

    final outputs = await process(fooAssetId,
        platformDirectives: ['package:a/bar.dart#PLATFORM']);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(_generatedCode(outputs))
      ..toBeNotNull()
      ..toContain(barComponentMeta.template.template);
  });

  it('should include platform directives when it is a list.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '<bar></bar>');
    final viewAnnotation = new AnnotationModel()
      ..name = 'View';

    barNgMeta.identifiers['PLATFORM'] = barComponentMeta;
    updateReader();

    final outputs = await process(fooAssetId,
        platformDirectives: ['package:a/bar.dart#PLATFORM']);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
    expect(_generatedCode(outputs))
      ..toBeNotNull()
      ..toContain(barComponentMeta.template.template);
  });

  it('should work when platform directives config is null.', () async {
    final outputs = await process(fooAssetId, platformDirectives: null);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
  });

  it('should work when the platform directives config is not formatted properly.',
      () async {
    final outputs = await process(fooAssetId, platformDirectives: ['INVALID']);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
  });

  it('should work when the file with platform directives cannot be found.',
      () async {
    final outputs = await process(fooAssetId,
        platformDirectives: ['package:a/invalid.dart#PLATFORM']);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
  });

  it('should work when the platform directives token cannot be found.',
      () async {
    final outputs = await process(fooAssetId,
        platformDirectives: ['package:a/bar.dart#PLATFORM']);
    final ngDeps = outputs.ngDeps;
    expect(ngDeps).toBeNotNull();
  });

  it('should parse `View` pipes with a single dependency.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '{{1 | bar}}');
    final viewAnnotation = new AnnotationModel()
      ..name = 'View';
    viewAnnotation.namedParameters.add(new NamedParameter()
      ..name = 'pipes'
      ..value = 'const [${barPipeMeta.type.name}]');
    fooNgMeta.ngDeps.reflectables.first.annotations.add(viewAnnotation);
    fooNgMeta.ngDeps.reflectables.first.pipes
        .add(new PrefixedType()..name = barPipeMeta.type.name);
    fooNgMeta.ngDeps.imports.add(new ImportModel()..uri = 'bar.dart');
    updateReader();

    final outputs = await process(fooAssetId);

    expect(_generatedCode(outputs))
      ..toContain("import 'bar.dart'")
      ..toContain(barPipeMeta.name);
  });

  it('should include platform pipes.', () async {
    fooComponentMeta.template =
        new CompileTemplateMetadata(template: '{{1 | bar}}');

    barNgMeta.aliases['PLATFORM'] = [barPipeMeta.type.name];
    updateReader();

    final outputs = await process(fooAssetId,
        platformPipes: ['package:a/bar.dart#PLATFORM']);

    expect(_generatedCode(outputs))
      ..toContain("import 'bar.dart'")
      ..toContain(barPipeMeta.name);
  });

  it('should use i18n parser when translations are provided.', () async {
    fooComponentMeta.template = new CompileTemplateMetadata(
        template: '<div i18n>content</div>',
        templateUrl: 'template.html');
    updateReader();

    final translations = deserializeXmb("""
      <message-bundle>
        <msg id="${id(new Message("content", null))}">another</msg>
      </message-bundle>
    """, "someUrl");

    final outputs = await process(fooAssetId, translations: translations);
    expect(_generatedCode(outputs)).toContain('another');
    expect(_generatedCode(outputs)).not.toContain('content');
  });
}

String _generatedCode(Outputs outputs) {
  final StringBuffer buf = new StringBuffer();
  final writer = new NgDepsWriter(buf);
  writeTemplateFile(writer, outputs.ngDeps, outputs.templatesSource);
  return buf.toString();
}

void _formatThenExpectEquals(String actual, String expected) {
  expect(formatter.format(actual)).toEqual(formatter.format(expected));
}
