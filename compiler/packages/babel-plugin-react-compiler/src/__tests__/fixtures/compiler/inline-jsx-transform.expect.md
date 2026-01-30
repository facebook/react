
## Input

```javascript
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

```

## Code

```javascript
import { c as _c2 } from "react/compiler-runtime"; // @inlineJsxTransform

function Parent(t0) {
  const $ = _c2(3);
  const { children, ref } = t0;
  let t1;
  if ($[0] !== children || $[1] !== ref) {
    if (DEV) {
      t1 = <div ref={ref}>{children}</div>;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: "div",
        ref: ref,
        key: null,
        props: { ref: ref, children: children },
      };
    }
    $[0] = children;
    $[1] = ref;
    $[2] = t1;
  } else {
    t1 = $[2];
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
        props: { a: "a", b: { b: "b" }, c: C, ref: testRef },
      };
    }
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function ParentAndChildren(props) {
  const $ = _c2(14);
  let t0;
  if ($[0] !== props.foo) {
    t0 = () => {
      let t1;
      if (DEV) {
        t1 = <div key="d">{props.foo}</div>;
      } else {
        t1 = {
          $$typeof: Symbol.for("react.transitional.element"),
          type: "div",
          ref: null,
          key: "d",
          props: { children: props.foo },
        };
      }
      return t1;
    };
    $[0] = props.foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const render = t0;
  let t1;
  if ($[2] !== props) {
    if (DEV) {
      t1 = <Child key="a" {...props} />;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Child,
        ref: null,
        key: "a",
        props: props,
      };
    }
    $[2] = props;
    $[3] = t1;
  } else {
    t1 = $[3];
  }

  const t2 = props.foo;
  let t3;
  if ($[4] !== props) {
    if (DEV) {
      t3 = <GrandChild key="c" className={t2} {...props} />;
    } else {
      t3 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: GrandChild,
        ref: null,
        key: "c",
        props: { className: t2, ...props },
      };
    }
    $[4] = props;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== render) {
    t4 = render();
    $[6] = render;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== t3 || $[9] !== t4) {
    if (DEV) {
      t5 = (
        <Child key="b">
          {t3}
          {t4}
        </Child>
      );
    } else {
      t5 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Child,
        ref: null,
        key: "b",
        props: { children: [t3, t4] },
      };
    }
    $[8] = t3;
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== t1 || $[12] !== t5) {
    if (DEV) {
      t6 = (
        <Parent>
          {t1}
          {t5}
        </Parent>
      );
    } else {
      t6 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Parent,
        ref: null,
        key: null,
        props: { children: [t1, t5] },
      };
    }
    $[11] = t1;
    $[12] = t5;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  return t6;
}

const propsToSpread = { a: "a", b: "b", c: "c" };
function PropsSpread() {
  const $ = _c2(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let t1;
    if (DEV) {
      t1 = <Test key="a" {...propsToSpread} />;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Test,
        ref: null,
        key: "a",
        props: propsToSpread,
      };
    }
    let t2;
    if (DEV) {
      t2 = <Test key="b" {...propsToSpread} a="z" />;
    } else {
      t2 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Test,
        ref: null,
        key: "b",
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

function ComponentWithSpreadPropsAndRef(t0) {
  const $ = _c2(6);
  let other;
  let ref;
  if ($[0] !== t0) {
    ({ ref, ...other } = t0);
    $[0] = t0;
    $[1] = other;
    $[2] = ref;
  } else {
    other = $[1];
    ref = $[2];
  }
  let t1;
  if ($[3] !== other || $[4] !== ref) {
    if (DEV) {
      t1 = <Foo ref={ref} {...other} />;
    } else {
      t1 = {
        $$typeof: Symbol.for("react.transitional.element"),
        type: Foo,
        ref: ref,
        key: null,
        props: { ref: ref, ...other },
      };
    }
    $[3] = other;
    $[4] = ref;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

// TODO: Support value blocks
function TernaryJsx(t0) {
  const $ = _c2(2);
  const { cond } = t0;
  let t1;
  if ($[0] !== cond) {
    t1 = cond ? <div /> : null;
    $[0] = cond;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

global.DEV = true;
export const FIXTURE_ENTRYPOINT = {
  fn: ParentAndChildren,
  params: [{ foo: "abc" }],
};

```
      
### Eval output
(kind: ok) <div><span class="abc">Hello world</span><div>abc</div></div>