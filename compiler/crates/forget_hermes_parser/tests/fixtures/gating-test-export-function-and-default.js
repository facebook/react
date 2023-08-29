// @gating @compilationMode(annotation)
export default function Bar(props) {
  "use forget";
  return <div>{props.bar}</div>;
}

function NoForget(props) {
  return <Bar>{props.noForget}</Bar>;
}

export function Foo(props) {
  "use forget";
  return <Foo>{props.bar}</Foo>;
}
