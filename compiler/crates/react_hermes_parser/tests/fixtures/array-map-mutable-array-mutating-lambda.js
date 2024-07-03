function Component(props) {
  const x = [];
  const y = x.map((item) => {
    item.updated = true;
    return item;
  });
  return [x, y];
}
