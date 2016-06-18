library bar;

import 'package:angular2/src/core/metadata.dart';
import 'baz.dart';

@Component(selector: 'soup')
@View(template: 'foo', directives: [Foo])
class MyComponent {
  MyComponent();
}
