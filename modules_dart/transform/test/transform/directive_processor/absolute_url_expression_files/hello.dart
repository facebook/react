library playground.src.hello_world.absolute_url_expression_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(
    templateUrl: 'package:other_package/template.html',
    styleUrls: const ['package:other_package/template.css'])
class HelloCmp {}

@Injectable()
hello() {}
