/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let babel = require('babel-core');
let freshPlugin = require('react-fresh/babel');

function transform(input, options = {}) {
  return babel.transform(input, {
    babelrc: false,
    plugins: ['syntax-jsx', freshPlugin],
  }).code;
}

describe('ReactFreshBabelPlugin', () => {
  it('registers top-level function declarations', () => {
    // Hello and Bar should be registered, handleClick shouldn't.
    expect(
      transform(`
        function Hello() {
          function handleClick() {}
          return <h1 onClick={handleClick}>Hi</h1>;
        }

        function Bar() {
          return <Hello />;
        }
    `),
    ).toMatchSnapshot();
  });

  it('registers top-level exported function declarations', () => {
    expect(
      transform(`
        export function Hello() {
          function handleClick() {}
          return <h1 onClick={handleClick}>Hi</h1>;
        }

        export default function Bar() {
          return <Hello />;
        }

        function Baz() {
          return <h1>OK</h1>;
        }

        const NotAComp = 'hi';
        export { Baz, NotAComp };

        export function sum() {}
        export const Bad = 42;
    `),
    ).toMatchSnapshot();
  });

  it('registers top-level exported named arrow functions', () => {
    expect(
      transform(`
        export const Hello = () => {
          function handleClick() {}
          return <h1 onClick={handleClick}>Hi</h1>;
        };

        export let Bar = (props) => <Hello />;

        export default () => {
          // This one should be ignored.
          // You should name your components.
          return <Hello />;
        };
    `),
    ).toMatchSnapshot();
  });

  it('uses original function declaration if it get reassigned', () => {
    // This should register the original version.
    // TODO: in the future, we may *also* register the wrapped one.
    expect(
      transform(`
        function Hello() {
          return <h1>Hi</h1>;
        }
        Hello = connect(Hello);
    `),
    ).toMatchSnapshot();
  });

  it('only registers pascal case functions', () => {
    // Should not get registered.
    expect(
      transform(`
        function hello() {
          return 2 * 2;
        }
    `),
    ).toMatchSnapshot();
  });

  it('registers top-level variable declarations with function expressions', () => {
    // Hello and Bar should be registered; handleClick, sum, Baz, and Qux shouldn't.
    expect(
      transform(`
        let Hello = function() {
          function handleClick() {}
          return <h1 onClick={handleClick}>Hi</h1>;
        };
        const Bar = function Baz() {
          return <Hello />;
        };
        function sum() {}
        let Baz = 10;
        var Qux;
    `),
    ).toMatchSnapshot();
  });

  it('registers top-level variable declarations with arrow functions', () => {
    // Hello, Bar, and Baz should be registered; handleClick and sum shouldn't.
    expect(
      transform(`
        let Hello = () => {
          const handleClick = () => {};
          return <h1 onClick={handleClick}>Hi</h1>;
        }
        const Bar = () => {
          return <Hello />;
        };
        var Baz = () => <div />;
        var sum = () => {};
    `),
    ).toMatchSnapshot();
  });

  it('ignores HOC definitions', () => {
    // TODO: we might want to handle HOCs at usage site, however.
    // TODO: it would be nice if we could always avoid registering
    // a function that is known to return a function or other non-node.
    expect(
      transform(`
        let connect = () => {
          function Comp() {
            const handleClick = () => {};
            return <h1 onClick={handleClick}>Hi</h1>;
          }
          return Comp;
        };
        function withRouter() {
          return function Child() {
            const handleClick = () => {};
            return <h1 onClick={handleClick}>Hi</h1>;
          }
        };
    `),
    ).toMatchSnapshot();
  });

  it('ignores complex definitions', () => {
    expect(
      transform(`
        let A = foo ? () => {
          return <h1>Hi</h1>;
        } : null
        const B = (function Foo() {
          return <h1>Hi</h1>;
        })();
        let C = () => () => {
          return <h1>Hi</h1>;
        };
        let D = bar && (() => {
          return <h1>Hi</h1>;
        });
    `),
    ).toMatchSnapshot();
  });

  it('ignores unnamed function declarations', () => {
    expect(
      transform(`
        export default function() {}
    `),
    ).toMatchSnapshot();
  });
});
