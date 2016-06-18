library angular2.transform.common.formatter;

import 'package:dart_style/dart_style.dart';

AngularDartFormatter _formatter = null;

void init(DartFormatter formatter) {
  _formatter = new _RealFormatter(formatter);
}

AngularDartFormatter get formatter {
  if (_formatter == null) {
    _formatter = new _PassThroughFormatter();
  }
  return _formatter;
}

abstract class AngularDartFormatter {
  String format(String source, {uri});
}

class _PassThroughFormatter implements AngularDartFormatter {
  String format(String source, {uri}) => source;
}

class _RealFormatter implements AngularDartFormatter {
  final DartFormatter _formatter;

  _RealFormatter(this._formatter);

  String format(source, {uri}) => _formatter.format(source, uri: uri);
}
