library bar.ngfactory.dart;

import 'foo.dart';
import 'package:angular2/src/core/reflection/reflection.dart' as _ngRef;
import 'package:angular2/src/core/metadata.dart';
import 'bar.dart';
import 'package:angular2/src/core/metadata.ngfactory.dart' as i0;
import 'bar.ngfactory.dart' as i1;
export 'foo.dart';

var _visited = false;
void initReflector() {
  if (_visited) return;
  _visited = true;
  _ngRef.reflector
    ..registerType(
        MyComponent,
        new _ngRef.ReflectionInfo(
            const [MyComponentNgFactory], const [], () => new MyComponent()));
  i0.initReflector();
  i1.initReflector();
}
