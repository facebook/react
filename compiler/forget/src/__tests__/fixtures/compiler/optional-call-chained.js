function Component(props) {
  const object = makeObject();
  return object.a?.b?.c(props);
}
