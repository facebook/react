function Component(props) {
  const x = {};
  let fn;
  if (props.cond) {
    // mutable
    fn = () => {
      x.value = props.value;
    };
  } else {
    // immutable
    fn = () => {
      x.value;
    };
  }
  return fn;
}
