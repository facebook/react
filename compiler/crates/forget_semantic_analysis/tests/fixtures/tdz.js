function Component() {
  a; // invalid
  if (true) {
    a; // invalid
  }
  for (;;) {
    a; // invalid
  }
  function foo() {
    a; // will be a runtime tdz error but we don't detect that statically
  }
  foo(); // above is a runtime tdz error bc of this call
  let a;
}
