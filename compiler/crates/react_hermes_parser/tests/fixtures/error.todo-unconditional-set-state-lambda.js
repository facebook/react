function Component(props) {
  let y = 0;
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
    y = 1; // TODO: force foo's mutable range to extend, but ideally we can just remove this line
  };
  foo();

  return [x, y];
}
