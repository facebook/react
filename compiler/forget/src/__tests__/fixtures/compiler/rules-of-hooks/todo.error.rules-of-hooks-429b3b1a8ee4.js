// @skip
// Passed but should have errored

// These are neither functions nor hooks.
function _normalFunctionWithHook() {
  useHookInsideNormalFunction();
}
function _useNotAHook() {
  useHookInsideNormalFunction();
}
