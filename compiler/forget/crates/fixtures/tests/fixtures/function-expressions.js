function Component(props) {
  const x = 2;
  const foo = function foo(y) {
    let a = 1;
    let b;
    if (a === 1) {
      b = 5 + 3;
    } else {
      b = false;
    }
    x + y + a + b;
    const bar = function bar(z) {
      let c = 2;
      let d;
      d = 3;
      x + y + a + b + z + c + d;
    };
    bar;
    foo;
  };
}
