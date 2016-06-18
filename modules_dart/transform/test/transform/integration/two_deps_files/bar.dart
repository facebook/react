library bar;

import 'package:angular2/src/core/metadata.dart';
import 'foo.dart' as prefix;

@Component(selector: 'soup')
@View(template: '')
class MyComponent {
  final prefix.MyContext c;
  final prefix.MyDep generatedValue;
  MyComponent(this.c, prefix.MyDep inValue) {
    generatedValue = inValue;
  }
}
