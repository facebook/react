library playground.src.hello_world.unusual_component_files;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, NgElement;

@Component(
    selector: 'unusual-comp',
    exportAs: 'ComponentExportAsValue',
    changeDetection: ChangeDetectionStrategy.CheckAlways,
    inputs: const ['aProperty'],
    host: const {'hostKey': 'hostValue'},
    outputs: const ['anEvent'])
@View(templateUrl: 'template.html')
class UnusualComp {}

@Directive(
    selector: 'unusual-directive',
    exportAs: 'DirectiveExportAsValue',
    inputs: const ['aDirectiveProperty'],
    host: const {'directiveHostKey': 'directiveHostValue'},
    outputs: const ['aDirectiveEvent'])
class UnusualDirective {}
