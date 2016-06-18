library angular2.test.transform.integration.deferred;

// This stored as a constant because we need to be careful to avoid modifying
// source lines for files we rewrite.
// That is, we expect that modifications we make to input files do not change
// line numbers, and storing this expected output as code would allow it to be
// formatted, breaking our tests.
const indexContents = '''
library web_foo;

import 'index.ngfactory.dart' as ngStaticInit;import 'bar.ngfactory.dart' deferred as bar;

void main() {
  bar.loadLibrary().then((_) {bar.initReflector();}).then((_) {
    bar.execImmediate();
  });
}
''';

const barContents = '''
library bar;

import 'package:angular2/src/core/metadata.dart';

import 'dep.ngfactory.dart' deferred as dep;

@Component(selector: '[soup]')
@View(template: '')
class MyComponent {
  void doDeferredThing() {
    dep.loadLibrary().then((_) {dep.initReflector();}).then((_) {
      dep.doImmediateThing();
    });
  }
}

void execImmediate() {}
''';
