library bar;

import 'package:angular2/core.dart';

@Annotation1(prop1: 'value1')
@Annotation2(prop2: 'value2')
@Component(selector: 'xyz', template: '')
class MyComponent {
  int myNum;

  MyComponent();
}
