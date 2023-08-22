function Component(props) {
  let x = 5;
  let foo = () => {
    x = {};
  };
  foo();
  return x;
}
