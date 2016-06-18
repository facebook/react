library foo;

import 'package:angular2/angular2.dart';

@Injectable()
class MyDep {}

class MyContext {
  final MyDep selector;
  const MyContext(this.selector);
}
