library angular2.src.tools.tools;

import 'dart:js';
import 'package:angular2/src/core/linker/component_factory.dart'
    show ComponentRef;
import 'common_tools.dart' show AngularTools;

/**
 * Enabled Angular 2 debug tools that are accessible via your browser's
 * developer console.
 *
 * Usage:
 *
 * 1. Open developer console (e.g. in Chrome Ctrl + Shift + j)
 * 1. Type `ng.` (usually the console will show auto-complete suggestion)
 * 1. Try the change detection profiler `ng.profiler.timeChangeDetection()`
 *    then hit Enter.
 */
void enableDebugTools(ComponentRef<dynamic> ref) {
  final tools = new AngularTools(ref);
  context['ng'] = new JsObject.jsify({
    'profiler': {
      'timeChangeDetection': ([config]) {
        tools.profiler.timeChangeDetection(config);
      }
    }
  });
}

/**
 * Disables Angular 2 tools.
 */
void disableDebugTools() {
  context.deleteProperty('ng');
}
