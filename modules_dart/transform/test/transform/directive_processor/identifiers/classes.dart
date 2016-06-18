library angular2.test.transform.directive_processor.identifiers.classes;

import 'package:angular2/angular2.dart' show Injectable;

class Service1 {}

@Injectable()
class Service2 {
  Service2(Service1 service1) {}
}