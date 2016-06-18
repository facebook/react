/**
 * Tracing for Dart applications.
 *
 * The tracing API hooks up to either [WTF](http://google.github.io/tracing-framework/) or
 * [Dart Observatory](https://www.dartlang.org/tools/observatory/).
 */
library angular2.src.core.wtf_impl;

typedef dynamic WtfScopeFn([arg0, arg1]);

var context = null;
var _trace;
var _events;
var _createScope;
var _leaveScope;
var _beginTimeRange;
var _endTimeRange;
final List _arg1 = [null];
final List _arg2 = [null, null];

bool detectWTF() {
  if (context != null && context.hasProperty('wtf')) {
    var wtf = context['wtf'];
    if (wtf.hasProperty('trace')) {
      _trace = wtf['trace'];
      _events = _trace['events'];
      _createScope = _events['createScope'];
      _leaveScope = _trace['leaveScope'];
      _beginTimeRange = _trace['beginTimeRange'];
      _endTimeRange = _trace['endTimeRange'];
      return true;
    }
  }
  return false;
}

int getArgSize(String signature) {
  int start = signature.indexOf('(') + 1;
  int end = signature.indexOf(')', start);
  bool found = false;
  int count = 0;
  for (var i = start; i < end; i++) {
    var ch = signature[i];
    if (identical(ch, ',')) {
      found = false;
    }
    if (!found) {
      found = true;
      count++;
    }
  }
  return count;
}

dynamic createScope(String signature, [flags]) {
  _arg2[0] = signature;
  _arg2[1] = flags;
  var jsScope = _createScope.apply(_arg2, thisArg: _events);
  switch (getArgSize(signature)) {
    case 0:
      return ([arg0, arg1]) {
        return jsScope.apply(const []);
      };
    case 1:
      return ([arg0, arg1]) {
        _arg1[0] = arg0;
        return jsScope.apply(_arg1);
      };
    case 2:
      return ([arg0, arg1]) {
        _arg2[0] = arg0;
        _arg2[1] = arg1;
        return jsScope.apply(_arg2);
      };
    default:
      throw "Max 2 arguments are supported.";
  }
}

void leave(scope, [returnValue]) {
  _arg2[0] = scope;
  _arg2[1] = returnValue;
  _leaveScope.apply(_arg2, thisArg: _trace);
  return returnValue;
}

dynamic startTimeRange(String rangeType, String action) {
  _arg2[0] = rangeType;
  _arg2[1] = action;
  return _beginTimeRange.apply(_arg2, thisArg: _trace);
}

void endTimeRange(dynamic range) {
  _arg1[0] = range;
  _endTimeRange.apply(_arg1, thisArg: _trace);
}
