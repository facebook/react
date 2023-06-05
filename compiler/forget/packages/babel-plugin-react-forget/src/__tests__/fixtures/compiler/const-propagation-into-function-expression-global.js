function foo() {
  const isX = GLOBAL_IS_X;
  const getJSX = () => {
    <Child x={isX}></Child>;
  };
  const result = getJSX();
  return result;
}
