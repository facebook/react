function Component(props) {
  return (
    <Foo bool={true} str="string" number={3.14} var={props.variable}>
      Hello
      {props.foo}
      <div>{props.bar}</div>
    </Foo>
  );
}
