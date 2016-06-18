library angular2.test.transform.directive_processor.bad_directives_files.pipes;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;
import 'dep1.dart';

@Component(selector: 'component-first', pipes: [Dep])
@View(template: '<div>Hi</div>')
class BadDirectives {}
