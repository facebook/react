library angular2.test.compiler.metadata_resolver_fixture;

import "package:angular2/core.dart" show Component;

// This component is not actually malformed; this fixture is here to
// make Dart not complain about a missing import for a test case that only
// matters in an JavaScript app.
@Component(template: "")
class MalformedStylesComponent {}
