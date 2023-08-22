function foo() {
  const x = 42;
  const f = () => {
    console.log(x);
  };
  f();
  return x;
}
