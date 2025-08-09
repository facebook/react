export enum ErrorSeverity {
  /**
   * Invalid JS syntax, or valid syntax that is semantically invalid which may indicate some
   * misunderstanding on the user’s part.
   */
  InvalidJS = 'InvalidJS',
  /**
   * JS syntax that is not supported and which we do not plan to support. Developers should
   * rewrite to use supported forms.
   */
  UnsupportedJS = 'UnsupportedJS',
  /**
   * Code that breaks the rules of React.
   */
  InvalidReact = 'InvalidReact',
  /**
   * Incorrect configuration of the compiler.
   */
  InvalidConfig = 'InvalidConfig',
  /**
   * Code that can reasonably occur and that doesn't break any rules, but is unsafe to preserve
   * memoization.
   */
  CannotPreserveMemoization = 'CannotPreserveMemoization',
  /**
   * Unhandled syntax that we don't support yet.
   */
  Todo = 'Todo',
  /**
   * An unexpected internal error in the compiler that indicates critical issues that can panic
   * the compiler.
   */
  Invariant = 'Invariant',
}
