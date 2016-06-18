library angular2.core.facade.async;

import 'dart:async';
export 'dart:async' show Stream, StreamController, StreamSubscription;

export 'promise.dart';

class TimerWrapper {
  static Timer setTimeout(fn(), int millis) =>
      new Timer(new Duration(milliseconds: millis), fn);
  static void clearTimeout(Timer timer) {
    timer.cancel();
  }

  static Timer setInterval(fn(), int millis) {
    var interval = new Duration(milliseconds: millis);
    return new Timer.periodic(interval, (Timer timer) {
      fn();
    });
  }

  static void clearInterval(Timer timer) {
    timer.cancel();
  }
}

class ObservableWrapper {
  static StreamSubscription subscribe/*<T>*/(Stream s, onNext(/*=T*/ value),
      [onError, onComplete]) {
    return s.listen(onNext,
        onError: onError, onDone: onComplete, cancelOnError: true);
  }

  static bool isObservable(obs) {
    return obs is Stream;
  }

  /**
   * Returns whether `emitter` has any subscribers listening to events.
   */
  static bool hasSubscribers(EventEmitter emitter) {
    return emitter._controller.hasListener;
  }

  static void dispose(StreamSubscription s) {
    s.cancel();
  }

  @Deprecated('Use callEmit() instead')
  static void callNext(EventEmitter emitter, value) {
    emitter.add(value);
  }

  static void callEmit(EventEmitter emitter, value) {
    emitter.add(value);
  }

  static void callError(EventEmitter emitter, error) {
    emitter.addError(error);
  }

  static void callComplete(EventEmitter emitter) {
    emitter.close();
  }

  static Stream fromPromise(Future f) {
    return new Stream.fromFuture(f);
  }

  static Future toPromise(Stream s) {
    return s.single;
  }
}

class EventEmitter<T> extends Stream<T> {
  StreamController<T> _controller;

  /// Creates an instance of [EventEmitter], which depending on [isAsync],
  /// delivers events synchronously or asynchronously.
  EventEmitter([bool isAsync = true]) {
    _controller = new StreamController<T>.broadcast(sync: !isAsync);
  }

  StreamSubscription<T> listen(void onData(T event),
      {Function onError, void onDone(), bool cancelOnError}) {
    return _controller.stream.listen(onData,
        onError: onError, onDone: onDone, cancelOnError: cancelOnError);
  }

  void add(value) {
    _controller.add(value);
  }

  void emit(value) {
    _controller.add(value);
  }

  void addError(error) {
    _controller.addError(error);
  }

  void close() {
    _controller.close();
  }
}

//todo(robwormald): maybe fix in ts2dart?
class Subject<T> extends Stream<T> {
  StreamController<T> _controller;

  Subject([bool isAsync = true]) {
    _controller = new StreamController<T>.broadcast(sync: !isAsync);
  }

  StreamSubscription<T> listen(void onData(T data),
      {Function onError, void onDone(), bool cancelOnError}) {
    return _controller.stream.listen(onData,
        onError: onError, onDone: onDone, cancelOnError: cancelOnError);
  }

  void add(value) {
    _controller.add(value);
  }

  void addError(error) {
    _controller.addError(error);
  }

  void close() {
    _controller.close();
  }
}
