// @skip
// Passed but should have errored

// This is invalid because "use"-prefixed functions used in named
// functions are assumed to be hooks.
React.unknownFunction(function notAComponent(foo, bar) {
  useProbablyAHook(bar);
});
