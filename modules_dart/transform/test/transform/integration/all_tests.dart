library angular2.test.transform.integration;

import 'package:angular2/src/platform/server/html_adapter.dart';
import 'package:angular2/transformer.dart';
import 'package:dart_style/dart_style.dart';
import 'package:transformer_test/utils.dart';

import '../common/read_file.dart';
import 'deferred_files/expected/output.dart' as deferredOuts;

main() {
  allTests();
}

var formatter = new DartFormatter();
var transform = new AngularTransformerGroup(new TransformerOptions(
    ['web/index.dart'],
    formatCode: true,
    genCompiledTemplates: false));

// Each test has its own directory for inputs & an `expected` directory for
// expected outputs.
//
// In addition to these declared inputs, we inject a set of common inputs for
// every test.
const commonInputs = const {
  'angular2|lib/src/core/metadata.dart': '../../../lib/src/core/metadata.dart',
  'angular2|lib/src/core/application.dart': '../common/application.dart',
  'angular2|lib/src/core/reflection/reflection_capabilities.dart':
      '../common/reflection_capabilities.dart',
  'angular2|lib/core.dart': '../../../lib/core.dart',
  'angular2|lib/src/core/di/decorators.dart':
      '../../../lib/src/core/di/decorators.dart',
};

class IntegrationTestConfig {
  final String name;
  final Map<String, String> assetPathToInputPath;
  final Map<String, String> assetPathToExpectedOutputPath;
  final bool isolate;

  IntegrationTestConfig(this.name,
      {Map<String, String> inputs,
      Map<String, String> outputs,
      this.isolate: false})
      : this.assetPathToInputPath = inputs,
        this.assetPathToExpectedOutputPath = outputs;
}

void allTests() {
  Html5LibDomAdapter.makeCurrent();

  var tests = [
    new IntegrationTestConfig('should generate proper code for a Component defining only a selector.',
        inputs: {
          'a|web/index.dart': 'simple_annotation_files/index.dart',
          'a|web/bar.dart': 'simple_annotation_files/bar.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart':
              'simple_annotation_files/expected/bar.ngfactory.dart',
          'a|web/index.ngfactory.dart':
              'simple_annotation_files/expected/index.ngfactory.dart'
        }),
    new IntegrationTestConfig('should generate proper code for a Component with multiple deps.',
        inputs: {
          'a|web/index.dart': 'two_deps_files/index.dart',
          'a|web/foo.dart': 'two_deps_files/foo.dart',
          'a|web/bar.dart': 'two_deps_files/bar.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart': 'two_deps_files/expected/bar.ngfactory.dart'
        }),
    new IntegrationTestConfig(
        'should generate proper code for a Component declaring a '
        'componentService defined in another file.',
        inputs: {
          'a|web/index.dart': 'list_of_types_files/index.dart',
          'a|web/foo.dart': 'list_of_types_files/foo.dart',
          'a|web/bar.dart': 'list_of_types_files/bar.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart':
              'list_of_types_files/expected/bar.ngfactory.dart'
        }),
    new IntegrationTestConfig('should generate a factory for a class with no declared ctor.',
        inputs: {
          'a|web/index.dart': 'synthetic_ctor_files/index.dart',
          'a|web/bar.dart': 'synthetic_ctor_files/bar.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart':
              'synthetic_ctor_files/expected/bar.ngfactory.dart'
        }),
    new IntegrationTestConfig('should preserve multiple annotations.', inputs: {
      'a|web/index.dart': 'two_annotations_files/index.dart',
      'a|web/bar.dart': 'two_annotations_files/bar.dart',
      'angular2|lib/src/core/metadata.dart':
          '../../../lib/src/core/metadata.dart'
    }, outputs: {
      'a|web/bar.ngfactory.dart':
          'two_annotations_files/expected/bar.ngfactory.dart'
    }),
    new IntegrationTestConfig(
        'should handle Directive dependencies declared on a View.',
        inputs: {
          'a|web/index.dart': 'directive_dep_files/index.dart',
          'a|web/foo.dart': 'directive_dep_files/foo.dart',
          'a|web/bar.dart': 'directive_dep_files/bar.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart':
              'directive_dep_files/expected/bar.ngfactory.dart'
        }),
    new IntegrationTestConfig('should handle chained Directive dependencies declared on a View.',
        inputs: {
          'a|web/index.dart': 'directive_chain_files/index.dart',
          'a|web/foo.dart': 'directive_chain_files/foo.dart',
          'a|web/bar.dart': 'directive_chain_files/bar.dart',
          'a|web/baz.dart': 'directive_chain_files/baz.dart'
        },
        outputs: {
          'a|web/bar.ngfactory.dart':
              'directive_chain_files/expected/bar.ngfactory.dart'
        }),
    new IntegrationTestConfig('should handle empty template files that define directive aliases.',
        inputs: {
          'a|web/foo.dart': 'empty_ng_deps_files/foo.dart',
          'a|web/bar.dart': 'empty_ng_deps_files/bar.dart'
        },
        outputs: {
      'a|web/foo.ngfactory.dart':
          'empty_ng_deps_files/expected/foo.ngfactory.dart',
      'a|web/bar.ngfactory.dart':
          'empty_ng_deps_files/expected/bar.ngfactory.dart'
    })
  ];

  var cache = {};

  var isolateAny = tests.any((t) => t.isolate);

  for (var config in tests) {
    // Read in input & output files.
    config.assetPathToInputPath
      ..addAll(commonInputs)
      ..forEach((key, value) {
        config.assetPathToInputPath[key] =
            cache.putIfAbsent(value, () => _readFile(value));
      });
    config.assetPathToExpectedOutputPath.forEach((key, value) {
      config.assetPathToExpectedOutputPath[key] = cache.putIfAbsent(value, () {
        var code = _readFile(value);
        if (code == null) {
          throw 'Failed to read $value';
        }
        return value.endsWith('dart') ? formatter.format(code) : code;
      });
    });
    if (!isolateAny || config.isolate) {
      testPhases(
          config.name,
          [
            [transform]
          ],
          config.assetPathToInputPath,
          config.assetPathToExpectedOutputPath);
    }
  }

  _testDeferredRewriter();
}

void _testDeferredRewriter() {
  var inputs = {
    'a|web/bar.dart': 'deferred_files/bar.dart',
    'a|web/dep.dart': 'deferred_files/dep.dart',
    'a|web/index.dart': 'deferred_files/index.dart'
  };
  inputs.addAll(commonInputs);
  inputs.keys.forEach((k) => inputs[k] = _readFile(inputs[k]));
  var outputs = {
    'a|web/bar.ngfactory.dart':
        _readFile('deferred_files/expected/bar.ngfactory.dart'),
    'a|web/bar.dart': deferredOuts.barContents,
    'a|web/index.dart': deferredOuts.indexContents
  };
  testPhases(
      'should handle deferred imports in input files.',
      [
        [transform]
      ],
      inputs,
      outputs);
}

/// Smooths over differences in CWD between IDEs and running tests in Travis.
String _readFile(String path) => readFile('integration/$path');
