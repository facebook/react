library angular2.test.transform.stylesheet_compiler.all_tests;

import 'dart:async';
import 'dart:convert';

import 'package:angular2/src/transform/stylesheet_compiler/transformer.dart';

import 'package:barback/barback.dart';
import 'package:guinness/guinness.dart';

import '../common/recording_logger.dart';

const SIMPLE_CSS = '''
.foo {
  width: 10px;
}
''';

const HTTP_IMPORT = 'https://fonts.googleapis.com/css?family=Roboto';
const CSS_WITH_IMPORT = '@import url(${HTTP_IMPORT});';

main() {
  Html5LibDomAdapter.makeCurrent();
  allTests();
}

allTests() {
  StylesheetCompiler subject;

  beforeEach(() {
    subject = new StylesheetCompiler();
  });

  it('should accept CSS assets', () {
    expect(subject.isPrimary(new AssetId('somepackage', 'lib/style.css')))
        .toBe(true);
  });

  it('should reject non-CSS assets', () {
    expect(subject.isPrimary(new AssetId('somepackage', 'lib/style.scss')))
        .toBe(false);
  });

  it('should compile stylesheets', () async {
    var cssFile = new Asset.fromString(
        new AssetId('somepackage', 'lib/style.css'), SIMPLE_CSS);
    var transform = new FakeTransform()..primaryInput = cssFile;
    await subject.apply(transform);
    expect(transform.outputs.length).toBe(2);
    expect(transform.outputs[0].id.toString())
        .toEqual('somepackage|lib/style.css.dart');
    expect(transform.outputs[1].id.toString())
        .toEqual('somepackage|lib/style.css.shim.dart');
  });

  it('should compile stylesheets with imports', () async {
    var cssFile = new Asset.fromString(
        new AssetId('somepackage', 'lib/style.css'), CSS_WITH_IMPORT);
    var transform = new FakeTransform()..primaryInput = cssFile;
    await subject.apply(transform);
    expect(transform.outputs.length).toBe(2);
    expect(transform.outputs[0].id.toString())
        .toEqual('somepackage|lib/style.css.dart');
    expect(transform.outputs[1].id.toString())
        .toEqual('somepackage|lib/style.css.shim.dart');
    expect(await transform.outputs[0].readAsString()).toContain(HTTP_IMPORT);
    expect(await transform.outputs[1].readAsString()).toContain(HTTP_IMPORT);
  });
}

@proxy
class FakeTransform implements Transform {
  final outputs = <Asset>[];
  Asset primaryInput;
  final _logger = new RecordingLogger();

  get logger => _logger;

  addOutput(Asset output) {
    this.outputs.add(output);
  }

  readInputAsString(AssetId id, {Encoding encoding}) {
    if (id == primaryInput.id) {
      return primaryInput.readAsString(encoding: encoding);
    }
    throw 'Could not read input $id';
  }

  noSuchMethod(Invocation i) {
    throw '${i.memberName} not implemented';
  }
}

@proxy
class FakeDeclaringTransform implements DeclaringTransform {
  final outputs = <AssetId>[];
  AssetId primaryId;

  declareOutput(AssetId output) {
    this.outputs.add(output);
  }

  noSuchMethod(Invocation i) {
    throw '${i.memberName} not implemented';
  }
}
