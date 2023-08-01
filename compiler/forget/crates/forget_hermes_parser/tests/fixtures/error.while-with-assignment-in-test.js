function f(reader) {
  const queue = [1, 2, 3];
  let value = 0;
  let sum = 0;
  // BUG: we need to codegen the complex test expression
  while ((value = queue.pop()) != null) {
    sum += value;
  }
  return sum;
}
