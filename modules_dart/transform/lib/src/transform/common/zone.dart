library angular2.src.transform.common.zone;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:barback/barback.dart';
import 'package:source_span/source_span.dart';

import 'package:angular2/src/compiler/offline_compiler.dart';

typedef _SimpleCallback();

// Keys used to store zone local values on the current zone.
final _loggerKey = #loggingZonedLoggerKey;
final _templateCompilerKey = #templateCompilerKey;

/// Executes `fn` inside a new `Zone` with the provided zone-local values.
Future<dynamic> exec(_SimpleCallback fn,
    {TransformLogger log, OfflineCompiler templateCompiler}) async {
  return runZoned(() async {
    try {
      return await fn();
    } on AnalyzerError catch (e) {
      // Do not worry about printing the stack trace, barback will handle
      // that on its own when it catches the rethrown exception.
      log.error('  Failed with ${e.runtimeType}\n${_friendlyError(e.error)}');
      rethrow;
    } on AnalyzerErrorGroup catch (eGroup) {
      // See above re: stack trace.
      var numErrors = eGroup.errors.length;
      if (numErrors == 1) {
        log.error(_friendlyError(eGroup.errors[0].error));
      } else {
        var buf = new StringBuffer();
        buf.writeln('  Failed with ${numErrors} errors');
        for (var i = 0; i < numErrors; ++i) {
          buf.writeln(
              'Error ${i + 1}: ${_friendlyError(eGroup.errors[i].error)}');
        }
        log.error('$buf');
      }
      rethrow;
    }
  }, zoneValues: {_loggerKey: log, _templateCompilerKey: templateCompiler});
}

/// The [TransformLogger] for the current zone.
///
/// Typically, this should not be used directly, since it will return `null` if
/// there is no [TransformLogger] registered on the current zone. Instead,
/// import `logging.dart` and use the `log` value it exports, which defines a
/// reasonable default value.
TransformLogger get log => Zone.current[_loggerKey] as TransformLogger;

/// The [OfflineCompiler] for the current zone.
///
/// This will return `null` if there is no [OfflineCompiler] registered on the
/// current zone.
OfflineCompiler get templateCompiler =>
    Zone.current[_templateCompilerKey] as OfflineCompiler;

/// Generate a human-readable error message from `error`.
String _friendlyError(AnalysisError error) {
  if (error.source != null) {
    var file =
        new SourceFile(error.source.contents.data, url: error.source.fullName);

    return file
        .span(error.offset, error.offset + error.length)
        .message(error.message, color: false);
  } else {
    return '<unknown location>: ${error.message}';
  }
}
