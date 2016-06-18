library angular2.test.transform.directive_processor.directive_files.dep1;

import 'package:angular2/angular2.dart'
    show Component, Directive, View, Pipe, Injectable;

@Component(selector: 'dep1')
@View(template: 'Dep1')
class Dep {}

@Pipe(name: 'dep1')
class PipeDep {}

@Injectable()
class ServiceDep {
  const ServiceDep();
  static someFactory() {}
}
