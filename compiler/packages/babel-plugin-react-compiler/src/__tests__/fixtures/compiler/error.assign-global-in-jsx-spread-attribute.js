function Component() {
  const foo = () => {
    someGlobal = true;
  };
  return <div {...foo} />;
}
