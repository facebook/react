/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

"use strict";

import { createArrayLogger } from "../../Logger";
import { PassName } from "../../Pass";
import * as TestDriver from "../../__tests__/TestDriver";
import * as IR from "../../IR";
import { printDiagnostic } from "../..";

const analyze = (source: string) => {
  const logs: string[] = [];
  const context = TestDriver.analyze(source, {
    stopPass: PassName.ReactFuncsInfer,
    logger: createArrayLogger(logs),
  });
  return {
    reactFuncs: [...context.irProg.funcs.values()],
    logs,
    diagnostics: context.diagnostics.map((diag) => printDiagnostic(diag)),
  };
};

describe("ReactFuncsInfer true positive", () => {
  it("use forget directive", () => {
    const { reactFuncs } = analyze(`
      function unknown() {
        "use forget";
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("unknown");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Unknown);
  });

  it("Component with use forget ", () => {
    const { reactFuncs } = analyze(`
      function Component() {
        "use forget";
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("Component");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Component);
  });

  it("Hook with use forget", () => {
    const { reactFuncs } = analyze(`
      function useHook() {
        "use forget";
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("useHook");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Hook);
  });

  it("Component with hooks", () => {
    const { reactFuncs } = analyze(`
      function ComponentWithHook() {
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("ComponentWithHook");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Component);
  });

  it("Component with hooks and use forget", () => {
    const { reactFuncs } = analyze(`
      function ComponentWithHook() {
        "use forget";
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("ComponentWithHook");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Component);
  });

  it("Higher-order Component with hooks", () => {
    const { reactFuncs } = analyze(`
      function createComponentWithHook() {
        return function ComponentWithHook() {
          useHook();
        };
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("ComponentWithHook");
  });

  it("Hooks with hooks", () => {
    const { reactFuncs } = analyze(`
      function useHookWithHook() {
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("useHookWithHook");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Hook);
  });

  it("Hooks with hooks and use forget", () => {
    const { reactFuncs } = analyze(`
      function useHookWithHook() {
        "use forget";
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("useHookWithHook");
  });

  it("Higher-order hooks with hooks", () => {
    const { reactFuncs } = analyze(`
      function createHook() {
        return function useHookWithHook() {
          useHook()
        }
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("useHookWithHook");
    expect(reactFuncs[0].kind).toBe(IR.FuncKind.Hook);
  });

  it("Memo Callback", () => {
    const { reactFuncs } = analyze(`
      let a = React.memo(function MemoCallback() {
        useHook();
      })
      let b = memo(() => { useHook() })
    `);

    expect(reactFuncs.length).toBe(2);
    expect(reactFuncs[0].name).toBe("MemoCallback");
  });

  it("ForwardRef Callback", () => {
    const { reactFuncs } = analyze(`
      let a = React.forwardRef(function ForwardRefCallback() {
        useHook();
      })
      let b = forwardRef(() => { useHook() })
    `);

    expect(reactFuncs.length).toBe(2);
    expect(reactFuncs[0].name).toBe("ForwardRefCallback");
  });

  it("VariableDeclarator", () => {
    const { reactFuncs } = analyze(`
      const A = () => { useHooks() }
      const b = () => { useHooks() } // negative
      let c = function C() { useHooks() }
      let d = function () { useHooks() }  // negative
      let e = function E () { useHooks() }
    `);

    expect(reactFuncs.length).toBe(3);
    expect(reactFuncs[0].name).toBe("A");
    expect(reactFuncs[1].name).toBe("C");
    expect(reactFuncs[2].name).toBe("E");
  });
});

describe("ReactFuncsInfer true negative", () => {
  it("Normal func", () => {
    expect(
      analyze(`
         function normalFunction() {}
      `).reactFuncs.length
    ).toBe(0);
  });

  it("use no forgot directive", () => {
    const { reactFuncs } = analyze(`
      function Bailout() {
        "use no forget";
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(0);
  });

  it("Component with only JSX", () => {
    const { reactFuncs } = analyze(`
      function ComponentWithOnlyJSX() {
        return <Bar />
      }
    `);

    expect(reactFuncs.length).toBe(0);
  });

  it("Function that starts with use but isn't hook", () => {
    const { reactFuncs } = analyze(`
      function NotReallyHook() {
        userFetch();
      }
    `);

    expect(reactFuncs.length).toBe(0);
  });

  it("normal func with hooks", () => {
    const { reactFuncs } = analyze(`
      function foo() {
        useHook()
      }
    `);

    expect(reactFuncs.length).toBe(0);
  });

  it("expression-body func with hooks", () => {
    const { reactFuncs, diagnostics, logs } = analyze(`
      const useHook = () => useHook()
    `);

    expect(reactFuncs.length).toBe(0);
    expect(diagnostics).toMatchSnapshot();
    expect(logs).toMatchSnapshot();
  });
});

/**
 * Test suites specifically for nesting.
 */
describe("ReactFuncsInfer Nesting", () => {
  it("Component with hook-less mapper", () => {
    const { reactFuncs } = analyze(`
      function ComponentWithMap({items}) {
        useHook()
        return (
          <div>
            {items.map((item, index) => (
              <FeedItem key={index} data={item} config={config} />
            ))}
          </div>
        );
      }
    `);

    expect(reactFuncs.length).toBe(1);
    expect(reactFuncs[0].name).toBe("ComponentWithMap");
  });

  // It's unclear why you need this, but both will be detected as components.
  it("Nested Component", () => {
    const { reactFuncs } = analyze(`
    function OuterComponent({items}) {
      useHook()
      function InnerComponnt() {
        useHook()
      }
    }
  `);

    expect(reactFuncs.length).toBe(2);
    expect(reactFuncs[0].name).toBe("OuterComponent");
    expect(reactFuncs[1].name).toBe("InnerComponnt");
  });
});

describe("ReactFuncsInfer error cases", () => {
  it("Component use hooks in conditional", () => {
    const { diagnostics, logs } = analyze(`
      function ComponentWithHookInConditional() {
        if (cond) {
          useHook()
        }
      }
    `);
    expect(diagnostics).toMatchSnapshot();
    expect(logs).toMatchSnapshot();
  });

  it("Component use hooks in loop", () => {
    const { diagnostics, logs } = analyze(`
      function ComponentWithHookInConditional() {
        for (let i = 0; i < ITEMS.length; i++) {
          useHook()
        }
      }
    `);
    expect(diagnostics).toMatchSnapshot();
    expect(logs).toMatchSnapshot();
  });

  it("Component use hooks in a block scope", () => {
    const { diagnostics, logs } = analyze(`
      function ComponentWithHookInBlock() {
        {
          useHook()
        }
      }
    `);
    expect(diagnostics).toMatchSnapshot();
    expect(logs).toMatchSnapshot();
  });

  it("Component use hooks in a try-catch block", () => {
    const { diagnostics, logs } = analyze(`
      function ComponentWithHookInTryCatch() {
        try {
          useHook()
        } catch {}
      }
    `);
    expect(diagnostics).toMatchSnapshot();
    expect(logs).toMatchSnapshot();
  });
});
