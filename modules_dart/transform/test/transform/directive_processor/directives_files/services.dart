library angular2.test.transform.directive_processor.directive_files.components;

import 'package:angular2/angular2.dart' show Injectable, Inject;
import 'dep1.dart';

@Injectable()
class Service {
  Service(ServiceDep arg1, @Inject(ServiceDep) arg2);
}
