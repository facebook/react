library angular2.transform.common.async_string_writer;

import 'dart:async';

import 'package:analyzer/src/generated/java_core.dart';

/// [PrintWriter] implementation that allows asynchronous printing via
/// [asyncPrint] and [asyncToString]. See those methods for details.
class AsyncStringWriter extends PrintWriter {
  /// All [Future]s we are currently waiting on.
  final List<Future<String>> _toAwait = <Future<String>>[];
  final List<StringBuffer> _bufs;
  StringBuffer _curr;
  int _asyncCount = 0;

  AsyncStringWriter._(StringBuffer curr)
      : _curr = curr,
        _bufs = <StringBuffer>[curr];

  AsyncStringWriter([Object content = ""]) : this._(new StringBuffer(content));

  @override
  void print(x) {
    _curr.write(x);
  }

  /// Adds the result of `futureText` to the writer at the current position
  /// in the string being built. If using this method, you must use
  /// [asyncToString] instead of [toString] to get the value of the writer or
  /// your string may not appear as expected.
  Future<String> asyncPrint(Future<String> futureText) {
    _semaphoreIncrement();
    var myBuf = new StringBuffer();
    _bufs.add(myBuf);
    _curr = new StringBuffer();
    _bufs.add(_curr);

    var toAwait = futureText.then((val) {
      myBuf.write(val);
      return val;
    });
    _toAwait.add(toAwait);
    return toAwait.whenComplete(() {
      _semaphoreDecrementAndCleanup();
      _toAwait.remove(toAwait);
    });
  }

  /// Waits for any values added via [asyncPrint] and returns the fully
  /// built string.
  Future<String> asyncToString() {
    _semaphoreIncrement();
    var bufLen = _bufs.length;
    return Future.wait(_toAwait).then((_) {
      return _bufs.sublist(0, bufLen).join('');
    }).whenComplete(_semaphoreDecrementAndCleanup);
  }

  @override
  String toString() => _bufs.map((buf) => '$buf').join('(async gap)');

  void _semaphoreIncrement() {
    ++_asyncCount;
  }

  void _semaphoreDecrementAndCleanup() {
    assert(_asyncCount > 0);

    --_asyncCount;
    if (_asyncCount == 0) {
      _curr = _bufs[0];
      for (var i = 1; i < _bufs.length; ++i) {
        _curr.write('${_bufs[i]}');
      }
      _bufs.removeRange(1, _bufs.length);
    }
  }
}
