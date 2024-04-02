function Component(props) {
  const x = [];
  x.push(props.items?.length);
  x.push(props.items?.edges?.map?.(render)?.filter?.(Boolean) ?? []);
  return x;
}
