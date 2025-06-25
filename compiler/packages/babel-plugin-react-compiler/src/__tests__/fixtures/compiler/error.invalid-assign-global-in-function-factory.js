function Component() {
  const f = () => () => {
    global.property = true;
  };
  f()();
  return <div>Ooops</div>;
}
