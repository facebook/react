// @skip
// Passed but should have errored

class C {
  m() {
    This.useHook();
    Super.useHook();
  }
}
