library playground.src.hello_world.url_expression_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(
    templateUrl: 'supersupersupersupersupersupersupersupersupersupersupersuper'
        'superlongtemplate.html',
    styleUrls: const [
      'pretty_longish_template.css',
      'other_pretty_longish_template.css'
    ])
class HelloCmp {}
