library fields;

import 'package:angular2/src/core/metadata.dart';

@Component(selector: '[fields]')
@View(template: '')
class FieldComponent {
  @FieldDecorator("field") String field;
}
