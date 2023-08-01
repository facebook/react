// @flow
function Component(props) {
  // We can infer that `x` is a primitive bc it is aliased to `y`,
  // which is used in a binary expression
  const x = foo();
  const y = (x: any);
  y + 1;
  return x;
}