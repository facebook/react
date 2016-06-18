library static_function_files.hello;

import 'package:angular2/angular2.dart';

@Injectable()
String getMessage(@Inject(Message) message) => message.value;

@Injectable()
class Message {
  String value = 'hello!';
}
