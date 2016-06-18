library angular2.dom.htmlAdapter;

import 'abstract_html_adapter.dart';
import 'package:angular2/platform/common_dom.dart';
import 'dart:io';

class Html5LibDomAdapter extends AbstractHtml5LibAdapter {
  static void makeCurrent() {
    setRootDomAdapter(new Html5LibDomAdapter());
  }

  logError(errorMessage) {
    stderr.writeln('${errorMessage}');
  }

  log(message) {
    stdout.writeln('${message}');
  }

  logGroup(message) {
    stdout.writeln('${message}');
  }

  logGroupEnd() {}
}
