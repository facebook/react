// @loggerTestOnly @validateStaticComponents
function Example(props) {
  const Component = props.foo.bar();
  return <Component />;
}
