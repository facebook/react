// @loggerTestOnly @validateStaticComponents
function Example(props) {
  let Component;
  if (props.cond) {
    Component = createComponent();
  } else {
    Component = DefaultComponent;
  }
  return <Component />;
}
