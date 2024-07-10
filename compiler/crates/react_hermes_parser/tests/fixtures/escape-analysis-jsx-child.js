function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    if (b) {
      y.push(c);
    }
    x.push(<div>{y}</div>);
  }
  return x;
}
