library playground.src.hello_world.absolute_url_expression_files;

import 'package:angular2/angular2.dart'
    show bootstrap, Component, Directive, View, NgElement;
export 'a.dart' show alias3;
import 'b.dart' as b;

@Component(selector: 'hello-app')
@View(templateUrl: 'template.html', styleUrls: const ['template.css'])
class HelloCmp {}

class Foo {}

// valid
const alias1 = const [HelloCmp];
// valid, even though it includes things that are not components
const alias2 = const [HelloCmp, Foo];

// Prefixed names are not supported
const alias4 = const [b.Baz];
