library router.spies;

import 'package:angular2/platform/common.dart' show PlatformLocation, Location;
import 'package:angular2/router.dart';
import 'package:angular2/testing_internal.dart';

@proxy
class SpyLocation extends SpyObject implements Location {}

@proxy
class SpyRouter extends SpyObject implements Router {}

@proxy
class SpyRouterOutlet extends SpyObject implements RouterOutlet {}

class SpyPlatformLocation extends SpyObject implements PlatformLocation {
  String pathname = null;
  String search = null;
  String hash = null;
}
