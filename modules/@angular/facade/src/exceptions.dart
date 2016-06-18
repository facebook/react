library angular.core.facade.exceptions;

import 'base_wrapped_exception.dart';
import 'exception_handler.dart';
export 'exception_handler.dart';

class BaseException extends Error {
  final String _message;

  BaseException([this._message]);

  String get message => _message;

  String toString() {
    return this.message;
  }
}

class WrappedException extends BaseWrappedException {
  final dynamic _context;
  final String _wrapperMessage;
  final originalException;
  final originalStack;

  WrappedException(
      [this._wrapperMessage,
      this.originalException,
      this.originalStack,
      this._context]);

  String get message {
    return ExceptionHandler.exceptionToString(this);
  }

  String toString() {
    return this.message;
  }

  dynamic get context => _context;

  String get wrapperMessage => _wrapperMessage;
}

Error makeTypeError([String message = ""]) {
  return new BaseException(message);
}

dynamic unimplemented() {
  throw new BaseException('unimplemented');
}
