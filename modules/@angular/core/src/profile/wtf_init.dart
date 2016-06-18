library angular2.src.core.wtf_init;

import 'dart:js' as js;
import 'wtf_impl.dart' as impl;

/**
 * Must be executed explicitly in Dart to set the JS Context.
 *
 * NOTE: this is done explicitly to allow WTF api not to depend on
 * JS context and possible to run the noop WTF stubs outside the browser.
 */
wtfInit() {
  impl.context = js.context;
}
