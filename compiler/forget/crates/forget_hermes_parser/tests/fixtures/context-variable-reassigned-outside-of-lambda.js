// @debug
function Component(props) {
  let x = null;
  const onChange = (e) => {
    console.log(x);
  };
  x = {};
  return <Foo onChange={onChange} />;
}
