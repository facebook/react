library bar;

import 'package:angular2/src/core/metadata.dart';

import 'dep.dart' deferred as dep;

@Component(selector: '[soup]')
@View(template: '')
class MyComponent {
  void doDeferredThing() {
    dep.loadLibrary().then((_) {
      dep.doImmediateThing();
    });
  }
}

void execImmediate() {}
