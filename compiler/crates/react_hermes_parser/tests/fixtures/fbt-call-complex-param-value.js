import fbt from "fbt";

function Component(props) {
  const text = fbt(
    `Hello, ${fbt.param("(key) name", capitalize(props.name))}!`,
    "(description) Greeting"
  );
  return <div>{text}</div>;
}
