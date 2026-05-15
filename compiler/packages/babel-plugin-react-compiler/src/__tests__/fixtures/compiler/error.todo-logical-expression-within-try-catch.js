function Component(props) {
  let result;
  try {
    result = props.cond && props.foo;
  } catch (e) {
    console.log(e);
  }
  return result;
}
