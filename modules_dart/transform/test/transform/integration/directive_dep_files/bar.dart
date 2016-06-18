library bar;

import 'package:angular2/src/core/metadata.dart';
import 'foo.dart' as prefix;

@Component(selector: 'soup')
@View(template: 'foo', directives: [prefix.Foo])
class MyComponent {
  MyComponent();
}
