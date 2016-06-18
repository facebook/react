library angular2.test.transform.directive_processor.pipe_files.pipes;

import 'package:angular2/angular2.dart' show Pipe;

@Pipe(name: 'nameOnly')
class NameOnlyPipe {}

@Pipe(name: 'nameAndPure', pure: true)
class NameAndPurePipe {}
