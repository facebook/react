library angular2.test.transform.common.recording_logger;

import 'package:barback/barback.dart';
import 'package:source_span/source_span.dart';

class RecordingLogger implements TransformLogger {
  bool hasErrors = false;

  List<String> logs = [];

  void _record(prefix, msg) => logs.add('$prefix: $msg');

  @override
  void info(msg, {AssetId asset, SourceSpan span}) => _record('INFO', msg);

  @override
  void fine(msg, {AssetId asset, SourceSpan span}) => _record('FINE', msg);

  @override
  void warning(msg, {AssetId asset, SourceSpan span}) => _record('WARN', msg);

  @override
  void error(msg, {AssetId asset, SourceSpan span}) {
    hasErrors = true;
    _record('ERROR', msg);
  }
}
