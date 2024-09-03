
## Input

```javascript
// @enableInlineJsxTransform

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
  return (
    <Parent foo={props.foo}>
      <Child key="a" />
      <Child key="b">
        <GrandChild className="gc-1" />
      </Child>
    </Parent>
  );
}

const propsToSpread = {a: 'a', b: 'b', c: 'c'};
function PropsSpread() {
  return <Test {...propsToSpread} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: ParentAndChildren,
  params: [{foo: 'abc'}],
};

```

## Code

```javascript
import { c as _c2 } from "react/compiler-runtime"; // @enableInlineJsxTransform

function Parent(t0) {
  const $ = _c2(2);
  const { children, ref } = t0;
  let t1;
  if ($[0] !== children) {
    t1 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: "div",
      ref: ref,
      key: null,
      props: { children: [children] },
    };
    $[0] = children;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

function Child(t0) {
  const $ = _c2(2);
  const { children } = t0;
  let t1;
  if ($[0] !== children) {
    t1 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Symbol.for("react.fragment"),
      ref: null,
      key: null,
      props: { children: [children] },
    };
    $[0] = children;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

function GrandChild(t0) {
  const $ = _c2(3);
  const { className } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: React.Fragment,
      ref: null,
      key: "fragmentKey",
      props: { children: ["Hello world"] },
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== className) {
    t2 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: "span",
      ref: null,
      key: null,
      props: { className: className, children: [t1] },
    };
    $[1] = className;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

function ParentAndRefAndKey(props) {
  const $ = _c2(1);
  const testRef = useRef();
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Parent,
      ref: testRef,
      key: "testKey",
      props: { a: "a", b: { b: "b" }, c: C },
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function ParentAndChildren(props) {
  const $ = _c2(4);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Child,
      ref: null,
      key: "a",
      props: {},
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Child,
      ref: null,
      key: "b",
      props: {
        children: [
          {
            $$typeof: Symbol.for("react.transitional.element"),
            type: GrandChild,
            ref: null,
            key: null,
            props: { className: "gc-1" },
          },
        ],
      },
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== props.foo) {
    t2 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Parent,
      ref: null,
      key: null,
      props: { foo: props.foo, children: [t0, t1] },
    };
    $[2] = props.foo;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

const propsToSpread = { a: "a", b: "b", c: "c" };
function PropsSpread() {
  const $ = _c2(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      $$typeof: Symbol.for("react.transitional.element"),
      type: Test,
      ref: null,
      key: null,
      props: { ...propsToSpread },
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: ParentAndChildren,
  params: [{ foo: "abc" }],
};

```
      
### Eval output
(kind: ok) <div><span class="gc-1">Hello world</span></div>