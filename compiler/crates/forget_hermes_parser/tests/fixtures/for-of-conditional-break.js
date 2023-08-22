function Component() {
  const x = [];
  for (const item of [1, 2]) {
    if (item === 1) {
      break;
    }
    x.push(item);
  }
  return x;
}
