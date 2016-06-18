library playground.src.hello_world.absolute_url_expression_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(template: _template0, styles: const [_style1,])
class HelloCmp {}

@Injectable() hello() {}
const _template0 = r'''{{greeting}}''';
const _style1 = r'''.greeting { .color: blue; }''';
