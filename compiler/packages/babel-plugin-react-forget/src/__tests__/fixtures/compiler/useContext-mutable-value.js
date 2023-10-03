// @debug
function Component(props) {
  const FooContext = useContext(Foo);
  const onClick = () => {
    FooContext.current = true;
  };
  return <div onClick={onClick} />;
}
