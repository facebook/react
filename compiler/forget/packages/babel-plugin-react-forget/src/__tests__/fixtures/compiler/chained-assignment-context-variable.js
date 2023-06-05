function Component() {
  let x,
    y = (x = {});
  const foo = () => {
    x = getObject();
  };
  foo();
  return [y, x];
}
