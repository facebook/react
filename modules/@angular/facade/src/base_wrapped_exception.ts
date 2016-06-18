/**
 * A base class for the WrappedException that can be used to identify
 * a WrappedException from ExceptionHandler without adding circular
 * dependency.
 */
export class BaseWrappedException extends Error {
  constructor(message: string) { super(message); }

  get wrapperMessage(): string { return ''; }
  get wrapperStack(): any { return null; }
  get originalException(): any { return null; }
  get originalStack(): any { return null; }
  get context(): any { return null; }
  get message(): string { return ''; }
}
