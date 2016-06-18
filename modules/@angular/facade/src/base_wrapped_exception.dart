library angular.core.facade.base_wrapped_exception;

/**
 * A base class for the WrappedException that can be used to identify
 * a WrappedException from ExceptionHandler without adding circular
 * dependency.
 */
class BaseWrappedException extends Error {
  BaseWrappedException();

  get originalException => null;
  get originalStack => null;

  String get message => '';
  String get wrapperMessage => '';
  dynamic get context => null;
}
