library playground.src.hello_world.template_files.property;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(selector: 'property')
@View(template: '<div [a]="b">Hi</div>')
class PropertyTestComponent {}
