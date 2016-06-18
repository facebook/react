library angular2.test.transform.inliner_for_test.false_match_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(styleUrls: const ['template.css'])
class HelloCmp {}

void main() {
  final testThing = new Component(templateUrl: 'template.html');
}
