library override;

import 'package:angular2/src/core/metadata.dart';

@Component(selector: '[getters]')
@View(template: '')
class FieldComponent implements ValGetter {
  @override
  String get getVal => 'a';
}

abstract class ValGetter {
  String get getVal;
}
