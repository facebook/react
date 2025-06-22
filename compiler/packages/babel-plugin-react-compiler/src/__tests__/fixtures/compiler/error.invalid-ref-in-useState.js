// @validateRefAccessDuringRender
function Component(props) {
  const ref = useRef(1);
  const [state] = useState(() => ref.current);
  return <div>{state}</div>;
}
