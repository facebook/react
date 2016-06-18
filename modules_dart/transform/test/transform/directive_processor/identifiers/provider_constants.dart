library angular2.test.transform.directive_processor.identifiers.constants;

import 'package:angular2/angular2.dart' show Provider;

class SomeClass {}

const a = const Provider("someToken", useClass: SomeClass);

const b = const [
  SomeClass,
  a,
  const Provider("someOtherToken", useClass: SomeClass)
];