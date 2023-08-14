// tslint:disable:no-unused-variable */
import { JSDOM } from "jsdom";
const React = require("react");
const render = require("@testing-library/react").render;

const { window: testWindow } = new JSDOM(undefined);

(globalThis as any).document = testWindow.document;
(globalThis as any).window = testWindow.window;
(globalThis as any).navigator = testWindow.navigator;
(globalThis as any).React = React;
(globalThis as any).render = render;

export type EvaluatorResult = {
  kind: "ok" | "exception" | "UnexpectedError";
  value: string;
  logs: Array<string>;
};

const PLACEHOLDER_VALUE = Symbol();
(globalThis as any).placeholderFn = function (..._args: Array<any>) {
  throw PLACEHOLDER_VALUE;
};
(globalThis as any).WrapperTestComponent = function (props: {
  fn: any;
  params: Array<any>;
}) {
  const result = props.fn(...props.params);
  const seen = new Map();

  return JSON.stringify(result, (_key, val) => {
    if (typeof val === "object") {
      let id = seen.get(val);
      if (id != null) {
        return `[[ cyclic ref *${id} ]]`;
      }
      seen.set(val, seen.size);
    }
    return val;
  });
};

export function doEval(source: string): EvaluatorResult {
  "use strict";

  const originalConsoleLog = console.log.bind(console);
  const logs: Array<string> = [];
  global.console.log = (...args: Array<any>) => {
    logs.push(`${args}`);
  };

  // source needs to be evaluated in the same scope as invoke
  const evalResult: any = eval(`
  (() => {
    // Exports should be overwritten by source
    let exports = {
      FIXTURE_ENTRYPOINT: {
        fn: globalThis.placeholderFn,
        args: [],
        isComponent: false,
      },
    };
    let reachedInvoke = false;
    try {
      ${source}
      reachedInvoke = true;

      if (exports.FIXTURE_ENTRYPOINT.isComponent) {
        // try to run fixture as a react component
        const result = render(
          React.createElement(
            exports.FIXTURE_ENTRYPOINT.fn,
            exports.FIXTURE_ENTRYPOINT.params)
        ).asFragment().textContent;

        return {
          kind: "ok",
          value: result ?? 'null',
        };
      } else {
        const result = render(
          React.createElement(
            WrapperTestComponent,
            exports.FIXTURE_ENTRYPOINT
          )
        ).asFragment().textContent;

        return {
          kind: "ok",
          value: result ?? 'null',
        };
      }
    } catch (e) {
      if (!reachedInvoke) {
        return {
          kind: "UnexpectedError",
          value: e.toString(),
        };
      } else if (e === PLACEHOLDER_VALUE) {
        return {
          kind: "UnexpectedError",
          value: 'FIXTURE_ENTRYPOINT not defined!',
        };
      } else {
        return {
          kind: "exception",
          value: e.stack,
        };
      }
    }
  })()`);

  globalThis.console.log = originalConsoleLog;
  const result = {
    ...evalResult,
    logs,
  };
  return result;
}
