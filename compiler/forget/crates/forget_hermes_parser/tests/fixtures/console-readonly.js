function Component(props) {
  const x = makeObject(props);
  // These calls should view x as readonly and be grouped outside of the reactive scope for x:
  console.log(x);
  console.info(x);
  console.warn(x);
  console.error(x);
  console.trace(x);
  console.table(x);
  return x;
}
