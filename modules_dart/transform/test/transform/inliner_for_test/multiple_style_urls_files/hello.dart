library playground.src.hello_world.multiple_style_urls_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(
    templateUrl: 'template.html',
    styleUrls: const ['template.css', 'template_other.css'])
class HelloCmp {}
