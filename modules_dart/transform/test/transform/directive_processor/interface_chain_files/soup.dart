library dinner.soup;

import 'package:angular2/src/core/metadata.dart';

@Component(selector: '[soup]')
@View(template: '')
class ChangingSoupComponent implements PrimaryInterface {}

class TernaryInterface {}

class SecondaryInterface implements TernaryInterface {}

class PrimaryInterface implements SecondaryInterface {}
