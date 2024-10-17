
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
    <Parent>
      <Child key="a" {...props} />
      <Child key="b">
        <GrandChild className={props.foo} {...props} />
      </Child>
    </Parent>
  );
}

const propsToSpread = {a: 'a', b: 'b', c: 'c'};
function PropsSpread() {
  return (
    <>
      <Test {...propsToSpread} />
      <Test {...propsToSpread} a="z" />
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

global.DEV = true;
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
    if (DEV) {
      t1 = <div ref={ref}>{children}</div>;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: "div",
        ref: ref,
        key: null,
        props: { children: children },
      };
    }
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
    if (DEV) {
      t1 = <>{children}</>;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Symbol.for("react.fragment"),
        ref: null,
        key: null,
        props: { children: children },
      };
    }
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
    if (DEV) {
      t1 = <React.Fragment key="fragmentKey">Hello world</React.Fragment>;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: React.Fragment,
        ref: null,
        key: "fragmentKey",
        props: { children: "Hello world" },
      };
    }
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let t2;
  if ($[1] !== className) {
    if (DEV) {
      t2 = <span className={className}>{t1}</span>;
    } else {
      t2 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: "span",
        ref: null,
        key: null,
        props: { className: className, children: t1 },
      };
    }
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
    if (DEV) {
      t0 = <Parent a="a" b={{ b: "b" }} c={C} key="testKey" ref={testRef} />;
    } else {
      t0 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Parent,
        ref: testRef,
        key: "testKey",
        props: { a: "a", b: { b: "b" }, c: C },
      };
    }
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function ParentAndChildren(props) {
  const $ = _c2(9);
  let t0;
  if ($[0] !== props) {
    if (DEV) {
      t0 = <Child key="a" {...props} />;
    } else {
      t0 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Child,
        ref: null,
        key: "a",
        props: props,
      };
    }
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }

  const t1 = props.foo;
  let t2;
  if ($[2] !== props) {
    if (DEV) {
      t2 = <GrandChild className={t1} {...props} />;
    } else {
      t2 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: GrandChild,
        ref: null,
        key: null,
        props: { className: t1, ...props },
      };
    }
    $[2] = props;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t2) {
    if (DEV) {
      t3 = <Child key="b">{t2}</Child>;
    } else {
      t3 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Child,
        ref: null,
        key: "b",
        props: { children: t2 },
      };
    }
    $[4] = t2;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== t0 || $[7] !== t3) {
    if (DEV) {
      t4 = (
        <Parent>
          {t0}
          {t3}
        </Parent>
      );
    } else {
      t4 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Parent,
        ref: null,
        key: null,
        props: { children: [t0, t3] },
      };
    }
    $[6] = t0;
    $[7] = t3;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}

const propsToSpread = { a: "a", b: "b", c: "c" };
function PropsSpread() {
  const $ = _c2(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let t1;
    if (DEV) {
      t1 = <Test {...propsToSpread} />;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Test,
        ref: null,
        key: null,
        props: propsToSpread,
      };
    }
    let t2;
    if (DEV) {
      t2 = <Test {...propsToSpread} a="z" />;
    } else {
      t2 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Test,
        ref: null,
        key: null,
        props: { ...propsToSpread, a: "z" },
      };
    }
    if (DEV) {
      t0 = (
        <>
          {t1}
          {t2}
        </>
      );
    } else {
      t0 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Symbol.for("react.fragment"),
        ref: null,
        key: null,
        props: { children: [t1, t2] },
      };
    }
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function ConditionalJsx(t0) {
  const $ = _c2(2);
  const { shouldWrap } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    if (DEV) {
      t1 = <div>Hello</div>;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: "div",
        ref: null,
        key: null,
        props: { children: "Hello" },
      };
    }
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  let content = t1;
  if (shouldWrap) {
    const t2 = content;
    let t3;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      if (DEV) {
        t3 = <Parent>{t2}</Parent>;
      } else {
        t3 = {
          $$typeof: Symbol.for("react.transitional.element"),
          type: Parent,
          ref: null,
          key: null,
          props: { children: t2 },
        };
      }
      $[1] = t3;
    } else {
      t3 = $[1];
    }
    content = t3;
  }
  return content;
}

global.__DEV__ = true;
export const FIXTURE_ENTRYPOINT = {
  fn: ParentAndChildren,
  params: [{ foo: "abc" }],
};

```
      
### Eval output
(kind: ok) <div><span class="abc">Hello world</span></div>