/// This file contains tests that make sense only in Dart
library angular2.test.facade.async_dart_spec;

import 'dart:async';
import 'package:angular2/testing_internal.dart';
import 'package:angular2/src/facade/async.dart';

class MockException implements Error {
  var message;
  var stackTrace;
}

class NonError {
  var message;
}

void functionThatThrows() {
  try {
    throw new MockException();
  } catch (e, stack) {
    // If we lose the stack trace the message will no longer match
    // the first line in the stack
    e.message = stack.toString().split('\n')[0];
    e.stackTrace = stack;
    rethrow;
  }
}

void functionThatThrowsNonError() {
  try {
    throw new NonError();
  } catch (e, stack) {
    // If we lose the stack trace the message will no longer match
    // the first line in the stack
    e.message = stack.toString().split('\n')[0];
    rethrow;
  }
}

void expectFunctionThatThrowsWithStackTrace(
    Future future, AsyncTestCompleter async) {
  PromiseWrapper.catchError(future, (err, StackTrace stack) {
    expect(stack.toString().split('\n')[0]).toEqual(err.message);
    async.done();
  });
}

main() {
  describe('async facade', () {
    describe('Completer', () {
      it(
          'should preserve Error stack traces',
          inject([AsyncTestCompleter], (async) {
            var c = PromiseWrapper.completer();

            expectFunctionThatThrowsWithStackTrace(c.promise, async);

            try {
              functionThatThrows();
            } catch (e) {
              c.reject(e, null);
            }
          }));

      it(
          'should preserve error stack traces for non-Errors',
          inject([AsyncTestCompleter], (async) {
            var c = PromiseWrapper.completer();

            expectFunctionThatThrowsWithStackTrace(c.promise, async);

            try {
              functionThatThrowsNonError();
            } catch (e, s) {
              c.reject(e, s);
            }
          }));
    });

    describe('PromiseWrapper', () {
      describe('reject', () {
        it(
            'should preserve Error stack traces',
            inject([AsyncTestCompleter], (async) {
              try {
                functionThatThrows();
              } catch (e) {
                var rejectedFuture = PromiseWrapper.reject(e, null);
                expectFunctionThatThrowsWithStackTrace(rejectedFuture, async);
              }
            }));

        it(
            'should preserve stack traces for non-Errors',
            inject([AsyncTestCompleter], (async) {
              try {
                functionThatThrowsNonError();
              } catch (e, s) {
                var rejectedFuture = PromiseWrapper.reject(e, s);
                expectFunctionThatThrowsWithStackTrace(rejectedFuture, async);
              }
            }));
      });
    });
  });
}
