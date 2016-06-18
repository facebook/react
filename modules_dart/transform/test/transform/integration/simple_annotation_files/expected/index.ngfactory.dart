library web_foo.ngfactory.dart;

import 'index.dart';
import 'package:angular2/src/core/reflection/reflection.dart' as _ngRef;
import 'package:angular2/platform/browser_static.dart' show bootstrapStatic;
import 'package:angular2/src/core/reflection/reflection.dart';
import 'bar.dart';
import 'bar.ngfactory.dart' as i0;
export 'index.dart';

var _visited = false;
void initReflector() {
  if (_visited) return;
  _visited = true;
  i0.initReflector();
}
