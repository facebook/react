library angular2.test.transform.directive_processor.bad_directives_files.template_url;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;
import 'dep1.dart';
import 'dep2.dart' as dep2;

@Component(selector: 'component-first', templateUrl: 'bad_template.html')
@View(templateUrl: 'good_template.html', directives: [Dep, dep2.Dep])
class BadTemplateUrl {}
