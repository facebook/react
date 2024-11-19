function Component(props) {
  useHook();
  const value = makeValue(props.value);
  let result;
  if (props.cond) {
    console.log(value + 1);
    result = value;
  } else {
    result = value.self();
  }
  return result;
}
