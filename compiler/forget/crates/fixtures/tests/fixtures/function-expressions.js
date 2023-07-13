function Component(props) {
  const y = 2;
  const foo = function foo(x) {
    let a = 1;
    let b;
    if (a === 1) {
      b = 5 + 3;
    } else {
      b = false;
    }
    return x + y + b;
  };
}
