library angular2.core.facade.promise;

import 'dart:async';
import 'dart:async' as async;

class PromiseWrapper {
  static Future/*<T>*/ resolve/*<T>*/(dynamic /*=T*/ obj) => new Future.value(obj);

  static Future/*<T>*/ reject/*<T>*/(dynamic /*=T*/ obj, Object stackTrace) => new Future.error(obj,
      stackTrace != null ? stackTrace : obj is Error ? (obj as Error).stackTrace : null);

  static Future<List/*<T>*/> all/*<T>*/(List<dynamic> promises) {
    return Future
      .wait(promises.map((p) => p is Future ? p as Future/*<T>*/ : new Future/*<T>*/.value(p)));
  }
  static Future/*<R>*/ then/*<T, R>*/(Future/*<T>*/ promise, dynamic /*=R*/ success(dynamic /*=T*/ value), [Function onError]) {
    if (success == null) return promise.catchError(onError);
    return promise.then(success, onError: onError);
  }

  static Future/*<T>*/ wrap/*<T>*/(dynamic /*=T*/ fn()) {
    return new Future(fn);
  }

  // Note: We can't rename this method to `catch`, as this is not a valid
  // method name in Dart.
  static Future catchError(Future promise, Function onError) {
    return promise.catchError(onError);
  }

  static void scheduleMicrotask(fn) {
    async.scheduleMicrotask(fn);
  }

  static bool isPromise(obj) {
    return obj is Future;
  }

  static PromiseCompleter/*<T>*/ completer/*<T>*/() =>
      new PromiseCompleter();
}

class PromiseCompleter<T> {
  final Completer<T> c = new Completer();

  Future<T> get promise => c.future;

  void resolve(v) {
    c.complete(v);
  }

  void reject(error, stack) {
    if (stack == null && error is Error) {
      stack = error.stackTrace;
    }
    c.completeError(error, stack);
  }
}
