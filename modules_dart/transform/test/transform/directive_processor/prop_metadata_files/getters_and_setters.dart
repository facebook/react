library fields;

import 'package:angular2/src/core/metadata.dart';

@Component(selector: '[getters-and-setters]')
@View(template: '')
class FieldComponent {
  String _val;
  @GetDecorator("get") String get myVal => _val;
  @SetDecorator("set") String set myVal(val) => _val = val;
}
