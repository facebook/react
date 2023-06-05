function Component() {
  const x = {};
  {
    let x = 56;
    const fn = function () {
      x = 42;
    };
    fn();
  }
  return x; // should return {}
}
