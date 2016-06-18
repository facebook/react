library angular2.test.transform.directive_processor.directive_files.dep2;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, Pipe, Injectable;

@Component(selector: 'dep2')
@View(template: 'Dep2')
class Dep {}

@Pipe(name: 'dep2')
class PipeDep {}

@Injectable()
class ServiceDep {}
