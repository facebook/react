// @runtimeModule="react-forget-runtime"
function Component(props) {
  const [x, setX] = useState(1);
  let y;
  if (props.cond) {
    y = x * 2;
  }
  return (
    <Button
      onClick={() => {
        setX(10 * y);
      }}></Button>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [true],
  isComponent: true,
};
