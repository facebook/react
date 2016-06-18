library angular.zone;

import 'dart:async';
import 'package:stack_trace/stack_trace.dart' show Chain;

typedef void ZeroArgFunction();
typedef void ErrorHandlingFn(error, stackTrace);

/**
 * A `Timer` wrapper that lets you specify additional functions to call when it
 * is cancelled.
 */
class WrappedTimer implements Timer {
  Timer _timer;
  ZeroArgFunction _onCancelCb;

  WrappedTimer(Timer timer) {
    _timer = timer;
  }

  void addOnCancelCb(ZeroArgFunction onCancelCb) {
    if (this._onCancelCb != null) {
      throw "On cancel cb already registered";
    }
    this._onCancelCb = onCancelCb;
  }

  void cancel() {
    if (this._onCancelCb != null) {
      this._onCancelCb();
    }
    _timer.cancel();
  }

  bool get isActive => _timer.isActive;
}

/**
 * Stores error information; delivered via [NgZone.onError] stream.
 */
class NgZoneError {
  /// Error object thrown.
  final error;
  /// Either long or short chain of stack traces.
  final List stackTrace;
  NgZoneError(this.error, this.stackTrace);
}

/**
 * A `Zone` wrapper that lets you schedule tasks after its private microtask queue is exhausted but
 * before the next "VM turn", i.e. event loop iteration.
 *
 * This lets you freely schedule microtasks that prepare data, and set an {@link onMicrotaskEmpty} handler that
 * will consume that data after it's ready but before the browser has a chance to re-render.
 *
 * A VM turn consist of a single macrotask followed 0 to many microtasks.
 *
 * The wrapper maintains an "inner" and "mount" `Zone`. The application code will executes
 * in the "inner" zone unless `runOutsideAngular` is explicitely called.
 *
 * A typical application will create a singleton `NgZone`. The mount zone is the `Zone` where the singleton has been
 * instantiated. The default `onMicrotaskEmpty` runs the Angular change detection.
 */
class NgZoneImpl {
  static bool isInAngularZone() {
    return Zone.current['isAngularZone'] == true;
  }

  // Number of microtasks pending from _innerZone (& descendants)
  int _pendingMicrotasks = 0;
  List<Timer> _pendingTimers = [];
  Function onEnter;
  Function onLeave;
  Function setMicrotask;
  Function setMacrotask;
  Function onError;

  Zone _outerZone;
  Zone _innerZone;
  /**
   * Associates with this
   *
   * - a "mount" [Zone], which is a the one that instantiated this.
   * - an "inner" [Zone], which is a child of the mount [Zone].
   *
   * @param {bool} trace whether to enable long stack trace. They should only be
   *               enabled in development mode as they significantly impact perf.
   */
  NgZoneImpl({
    bool trace,
    Function this.onEnter,
    Function this.onLeave,
    Function this.setMicrotask,
    Function this.setMacrotask,
    Function this.onError
  }) {
    _outerZone = Zone.current;

    if (trace) {
      _innerZone = Chain.capture(
        () => _createInnerZone(Zone.current),
        onError: _onErrorWithLongStackTrace
      );
    } else {
      _innerZone = _createInnerZone(
        Zone.current,
        handleUncaughtError: _onErrorWithoutLongStackTrace
      );
    }
  }

  Zone _createInnerZone(Zone zone, {handleUncaughtError}) {
    return zone.fork(
      specification: new ZoneSpecification(
        scheduleMicrotask: _scheduleMicrotask,
        run: _run,
        runUnary: _runUnary,
        runBinary: _runBinary,
        handleUncaughtError: handleUncaughtError,
        createTimer: _createTimer),
      zoneValues: {'isAngularZone': true}
    );
  }

  dynamic runInnerGuarded(fn()) {
    return _innerZone.runGuarded(fn);
  }

  dynamic runInner(fn()) {
    return _innerZone.run(fn);
  }

  /**
   * Runs `fn` in the mount zone and returns whatever it returns.
   *
   * In a typical app where the inner zone is the Angular zone, this allows one to escape Angular's
   * auto-digest mechanism.
   *
   * ```
   * void myFunction(NgZone zone, Element element) {
   *   element.onClick.listen(() {
   *     // auto-digest will run after element click.
   *   });
   *   zone.runOutsideAngular(() {
   *     element.onMouseMove.listen(() {
   *       // auto-digest will NOT run after mouse move
   *     });
   *   });
   * }
   * ```
   */
  dynamic runOuter(fn()) {
    return _outerZone.run(fn);
  }

  dynamic _run(Zone self, ZoneDelegate parent, Zone zone, fn()) {
    try {
      onEnter();
      return parent.run(zone, fn);
    } finally {
      onLeave();
    }
  }

  dynamic _runUnary(Zone self, ZoneDelegate parent, Zone zone, fn(arg), arg) =>
      _run(self, parent, zone, () => fn(arg));

  dynamic _runBinary(Zone self, ZoneDelegate parent, Zone zone, fn(arg1, arg2),
          arg1, arg2) =>
      _run(self, parent, zone, () => fn(arg1, arg2));

  void _scheduleMicrotask(Zone self, ZoneDelegate parent, Zone zone, fn) {
    if (_pendingMicrotasks == 0) {
      setMicrotask(true);
    }
    _pendingMicrotasks++;
    var microtask = () {
      try {
        fn();
      } finally {
        _pendingMicrotasks--;
        if (_pendingMicrotasks == 0) {
          setMicrotask(false);
        }
      }
    };
    parent.scheduleMicrotask(zone, microtask);
  }

  // Called by Chain.capture() on errors when long stack traces are enabled
  void _onErrorWithLongStackTrace(error, Chain chain) {
    final traces = chain.terse.traces.map((t) => t.toString()).toList();
    onError(new NgZoneError(error, traces));
  }

  // Outer zone handleUnchaughtError when long stack traces are not used
  void _onErrorWithoutLongStackTrace(Zone self, ZoneDelegate parent, Zone zone,
      error, StackTrace trace)
  {
    onError(new NgZoneError(error, [trace.toString()]));
  }

  Timer _createTimer(
      Zone self, ZoneDelegate parent, Zone zone, Duration duration, fn()) {
    WrappedTimer wrappedTimer;
    var cb = () {
      try {
        fn();
      } finally {
        _pendingTimers.remove(wrappedTimer);
        setMacrotask(_pendingTimers.isNotEmpty);
      }
    };
    Timer timer = parent.createTimer(zone, duration, cb);
    wrappedTimer = new WrappedTimer(timer);
    wrappedTimer.addOnCancelCb(() {
      _pendingTimers.remove(wrappedTimer);
      setMacrotask(_pendingTimers.isNotEmpty);
    });

    _pendingTimers.add(wrappedTimer);
    setMacrotask(true);
    return wrappedTimer;
  }

}
