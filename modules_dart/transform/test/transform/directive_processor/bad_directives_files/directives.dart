library angular2.test.transform.directive_processor.bad_directives_files.directives;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;
import 'dep1.dart';
import 'dep2.dart' as dep2;

@Component(selector: 'component-first', directives: [Dep, dep2.Dep])
@View(template: '<div>Hi</div>')
class BadDirectives {}
