library web_foo;

import 'package:angular2/platform/browser.dart';

abstract class TestBootstrapper {
  @AngularEntrypoint()
  void testBootstrap();
}
