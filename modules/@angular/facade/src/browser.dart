/**
 * Dart version of browser APIs. This library depends on 'dart:html' and
 * therefore can only run in the browser.
 */
library angular2.src.facade.browser;

import 'dart:js' show context;
import 'dart:html' show Location, window;

export 'dart:html'
    show
        document,
        window,
        Element,
        Node,
        MouseEvent,
        KeyboardEvent,
        Event,
        EventTarget,
        History,
        Location,
        EventListener;

Location get location => window.location;

final _gc = context['gc'];

void gc() {
  if (_gc != null) {
    _gc.apply(const []);
  }
}
