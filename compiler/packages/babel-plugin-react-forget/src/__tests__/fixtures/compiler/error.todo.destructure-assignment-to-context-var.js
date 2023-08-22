function useFoo(props) {
  let x;
  [x] = props;
  const foo = () => {
    x = getX(props);
  };
  foo();
  return { x };
}
