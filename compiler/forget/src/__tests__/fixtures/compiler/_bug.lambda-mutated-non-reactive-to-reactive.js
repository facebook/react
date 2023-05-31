function f(a) {
  let x;
  (() => {
    x = { a };
  })();
  return <div x={x} />;
}
