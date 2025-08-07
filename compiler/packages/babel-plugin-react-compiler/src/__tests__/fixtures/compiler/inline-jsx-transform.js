// @inlineJsxTransform

function Parent({children, a: _a, b: _b, c: _c, ref}) {
  return <div ref={ref}>{children}</div>;
}

function Child({children}) {
  return <>{children}</>;
}

function GrandChild({className}) {
  return (
    <span className={className}>
      <React.Fragment key="fragmentKey">Hello world</React.Fragment>
    </span>
  );
}

function ParentAndRefAndKey(props) {
  const testRef = useRef();
  return <Parent a="a" b={{b: 'b'}} c={C} key="testKey" ref={testRef} />;
}

function ParentAndChildren(props) {
  const render = () => {
    return <div key="d">{props.foo}</div>;
  };
  return (
    <Parent>
      <Child key="a" {...props} />
      <Child key="b">
        <GrandChild key="c" className={props.foo} {...props} />
        {render()}
      </Child>
    </Parent>
  );
}

const propsToSpread = {a: 'a', b: 'b', c: 'c'};
function PropsSpread() {
  return (
    <>
      <Test key="a" {...propsToSpread} />
      <Test key="b" {...propsToSpread} a="z" />
    </>
  );
}

function ConditionalJsx({shouldWrap}) {
  let content = <div>Hello</div>;

  if (shouldWrap) {
    content = <Parent>{content}</Parent>;
  }

  return content;
}

function ComponentWithSpreadPropsAndRef({ref, ...other}) {
  return <Foo ref={ref} {...other} />;
}

// TODO: Support value blocks
function TernaryJsx({cond}) {
  return cond ? <div /> : null;
}

global.DEV = true;
export const FIXTURE_ENTRYPOINT = {
  fn: ParentAndChildren,
  params: [{foo: 'abc'}],
};
