/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCacheStub } from "../test-utils/useMemoCacheStub";
import * as React from "react";
import { render } from "@testing-library/react";
import { expectLogsAndClear, log } from "./expectLogs";

React.useMemoCache = useMemoCacheStub;

function Hello({ name }) {
  "use forget";
  const items = [1, 2, 3].map((item) => <div key={item}>Item {item}</div>);
  log("render");
  return (
    <div>
      Hello <b>{name}</b>
      {items}
    </div>
  );
}

test("hello", () => {
  const { asFragment, rerender } = render(<Hello name="World" />);

  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div>
        Hello 
        <b>
          World
        </b>
        <div>
          Item 1
        </div>
        <div>
          Item 2
        </div>
        <div>
          Item 3
        </div>
      </div>
    </DocumentFragment>
  `);

  expectLogsAndClear(["render"]);

  rerender(<Hello name="Universe" />);

  expect(asFragment()).toMatchInlineSnapshot(`
    <DocumentFragment>
      <div>
        Hello 
        <b>
          Universe
        </b>
        <div>
          Item 1
        </div>
        <div>
          Item 2
        </div>
        <div>
          Item 3
        </div>
      </div>
    </DocumentFragment>
  `);

  expectLogsAndClear(__FORGET__ ? [] : ["render"]);
});
