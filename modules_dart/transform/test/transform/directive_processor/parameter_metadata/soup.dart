library dinner.soup;

import 'package:angular2/src/core/metadata.dart';

@Component(selector: '[soup]')
@View(template: '')
class SoupComponent {
  SoupComponent(@Tasty() String description, @Inject(Salt) salt);
}
