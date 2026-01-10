// @validateNoImpureFunctionsInRender
function Component() {
  const now = () => Date.now();
  const render = () => {
    return <div>{now()}</div>;
  };
  return <div>{render()}</div>;
}
