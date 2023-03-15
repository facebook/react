function ternary(props) {
  let x = 0;
  const y = props.a ? (x = 1) : (x = 2);
  return x + y;
}
