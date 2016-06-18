library playground.src.hello_world.multiple_style_urls_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'hello-app')
@View(template: _template0, styles: const [_style1, _style2,])
class HelloCmp {}

const _template0 = r'''{{greeting}}''';
const _style1 = r'''.greeting { .color: blue; }''';
const _style2 = r'''.hello { .color: red; }''';
