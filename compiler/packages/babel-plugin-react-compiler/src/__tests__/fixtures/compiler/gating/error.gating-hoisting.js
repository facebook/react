// @gating
const Foo = React.forwardRef(Foo_withRef);
function Foo_withRef(props, ref) {
  return <Bar ref={ref} {...props}></Bar>;
}
