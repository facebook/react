library angular2.test.transform.reflection_remover.method_annotation_files;

// This file is intentionally formatted as a string to avoid having the
// automatic transformer prettify it.
//
// This file represents transformed user code. Because this code will be
// linked to output by a source map, we cannot change line numbers from the
// original code and we therefore add our generated code on the same line as
// those we are removing.

const code = """
library web_foo;

import 'package:angular2/platform/browser_static.dart';import 'index.ngfactory.dart' as ngStaticInit;

class TestBootstrapper {
  @AngularEntrypoint("Method entrypoint")
  void testBootstrap() {ngStaticInit.initReflector();}
}
""";
