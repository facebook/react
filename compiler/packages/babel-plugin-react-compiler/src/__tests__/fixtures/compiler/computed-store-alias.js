function component(a, b) {
  let y = { a };
  let x = { b };
  x["y"] = y;
  mutate(x);
  return x;
}
