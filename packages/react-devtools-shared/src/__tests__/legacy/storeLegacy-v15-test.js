/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('Store (legacy)', () => {
  let React;
  let ReactDOM;
  let store;

  const act = (callback: Function) => {
    callback();

    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    store = global.store;

    // Redirect all React/ReactDOM requires to the v15 UMD.
    // We use the UMD because Jest doesn't enable us to mock deep imports (e.g. "react/lib/Something").
    jest.mock('react', () => jest.requireActual('react-15/dist/react.js'));
    jest.mock('react-dom', () =>
      jest.requireActual('react-dom-15/dist/react-dom.js'),
    );

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should not allow a root node to be collapsed', () => {
    const Component = () => <div>Hi</div>;

    act(() =>
      ReactDOM.render(<Component count={4} />, document.createElement('div')),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <Component>
            <div>
    `);

    expect(store.roots).toHaveLength(1);

    const rootID = store.roots[0];

    expect(() => store.toggleIsCollapsed(rootID, true)).toThrow(
      'Root nodes cannot be collapsed',
    );
  });

  describe('collapseNodesByDefault:false', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = false;
    });

    it('should support mount and update operations', () => {
      const Grandparent = ({count}) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Grandparent count={4} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
                  ▾ <Child key="2">
                      <div>
                  ▾ <Child key="3">
                      <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
                  ▾ <Child key="2">
                      <div>
                  ▾ <Child key="3">
                      <div>
      `);

      act(() => ReactDOM.render(<Grandparent count={2} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      const containerA = document.createElement('div');
      const containerB = document.createElement('div');

      act(() => {
        ReactDOM.render(<Parent key="A" count={3} />, containerA);
        ReactDOM.render(<Parent key="B" count={2} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
            ▾ <div>
              ▾ <Child key="0">
                  <div>
              ▾ <Child key="1">
                  <div>
              ▾ <Child key="2">
                  <div>
        [root]
          ▾ <Parent key="B">
            ▾ <div>
              ▾ <Child key="0">
                  <div>
              ▾ <Child key="1">
                  <div>
      `);

      act(() => {
        ReactDOM.render(<Parent key="A" count={4} />, containerA);
        ReactDOM.render(<Parent key="B" count={1} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
            ▾ <div>
              ▾ <Child key="0">
                  <div>
              ▾ <Child key="1">
                  <div>
              ▾ <Child key="2">
                  <div>
              ▾ <Child key="3">
                  <div>
        [root]
          ▾ <Parent key="B">
            ▾ <div>
              ▾ <Child key="0">
                  <div>
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerB));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
            ▾ <div>
              ▾ <Child key="0">
                  <div>
              ▾ <Child key="1">
                  <div>
              ▾ <Child key="2">
                  <div>
              ▾ <Child key="3">
                  <div>
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerA));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should not filter DOM nodes from the store tree', () => {
      const Grandparent = ({flip}) => (
        <div>
          <div>
            <Parent flip={flip} />
          </div>
          <Parent flip={flip} />
          <Nothing />
        </div>
      );
      const Parent = ({flip}) => (
        <div>
          {flip ? 'foo' : null}
          <Child />
          {flip && [null, 'hello', 42]}
          {flip ? 'bar' : 'baz'}
        </div>
      );
      const Child = () => <div>Hi!</div>;
      const Nothing = () => null;

      const container = document.createElement('div');
      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={false} />, container),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <div>
                ▾ <Parent>
                  ▾ <div>
                    ▾ <Child>
                        <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child>
                      <div>
                <Nothing>
      `);

      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={true} />, container),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <div>
                ▾ <Parent>
                  ▾ <div>
                    ▾ <Child>
                        <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child>
                      <div>
                <Nothing>
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should support collapsing parts of the tree', () => {
      const Grandparent = ({count}) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      act(() =>
        ReactDOM.render(
          <Grandparent count={2} />,
          document.createElement('div'),
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
      `);

      const grandparentID = store.getElementIDAtIndex(0);
      const parentOneID = store.getElementIDAtIndex(2);
      const parentTwoID = store.getElementIDAtIndex(8);

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <Parent>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <Parent>
              ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
              ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);

      act(() => store.toggleIsCollapsed(grandparentID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▾ <div>
                  ▾ <Child key="0">
                      <div>
                  ▾ <Child key="1">
                      <div>
              ▸ <Parent>
      `);
    });

    it('should support adding and removing children', () => {
      const Root = ({children}) => <div>{children}</div>;
      const Component = () => <div />;

      const container = document.createElement('div');

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="a" />
          </Root>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Component key="a">
                  <div>
      `);

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="a" />
            <Component key="b" />
          </Root>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Component key="a">
                  <div>
              ▾ <Component key="b">
                  <div>
      `);

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="b" />
          </Root>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Component key="b">
                  <div>
      `);
    });

    it('should support reordering of children', () => {
      const Root = ({children}) => <div>{children}</div>;
      const Component = () => <div />;

      const Foo = () => <div>{[<Component key="0" />]}</div>;
      const Bar = () => (
        <div>{[<Component key="0" />, <Component key="1" />]}</div>
      );
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Foo key="foo">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
              ▾ <Bar key="bar">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
                  ▾ <Component key="1">
                      <div>
      `);

      act(() => ReactDOM.render(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Bar key="bar">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
                  ▾ <Component key="1">
                      <div>
              ▾ <Foo key="foo">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Bar key="bar">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
                  ▾ <Component key="1">
                      <div>
              ▾ <Foo key="foo">
                ▾ <div>
                  ▾ <Component key="0">
                      <div>
      `);
    });
  });

  describe('collapseNodesByDefault:true', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = true;
    });

    it('should support mount and update operations', () => {
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      const container = document.createElement('div');

      act(() =>
        ReactDOM.render(
          <div>
            <Parent count={1} />
            <Parent count={3} />
          </div>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <div>
      `);

      act(() =>
        ReactDOM.render(
          <div>
            <Parent count={2} />
            <Parent count={1} />
          </div>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <div>
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      const containerA = document.createElement('div');
      const containerB = document.createElement('div');

      act(() => {
        ReactDOM.render(<Parent key="A" count={3} />, containerA);
        ReactDOM.render(<Parent key="B" count={2} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent key="A">
        [root]
          ▸ <Parent key="B">
      `);

      act(() => {
        ReactDOM.render(<Parent key="A" count={4} />, containerA);
        ReactDOM.render(<Parent key="B" count={1} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent key="A">
        [root]
          ▸ <Parent key="B">
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerB));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent key="A">
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerA));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should not filter DOM nodes from the store tree', () => {
      const Grandparent = ({flip}) => (
        <div>
          <div>
            <Parent flip={flip} />
          </div>
          <Parent flip={flip} />
          <Nothing />
        </div>
      );
      const Parent = ({flip}) => (
        <div>
          {flip ? 'foo' : null}
          <Child />
          {flip && [null, 'hello', 42]}
          {flip ? 'bar' : 'baz'}
        </div>
      );
      const Child = () => <div>Hi!</div>;
      const Nothing = () => null;

      const container = document.createElement('div');
      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={false} />, container),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <div>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <div>
              ▸ <Parent>
                <Nothing>
      `);

      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={true} />, container),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <div>
              ▸ <Parent>
                <Nothing>
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    it('should support expanding parts of the tree', () => {
      const Grandparent = ({count}) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({count}) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      act(() =>
        ReactDOM.render(
          <Grandparent count={2} />,
          document.createElement('div'),
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);

      const grandparentID = store.getElementIDAtIndex(0);

      act(() => store.toggleIsCollapsed(grandparentID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <div>
      `);

      const parentDivID = store.getElementIDAtIndex(1);
      act(() => store.toggleIsCollapsed(parentDivID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <Parent>
              ▸ <Parent>
      `);

      const parentOneID = store.getElementIDAtIndex(2);
      const parentTwoID = store.getElementIDAtIndex(3);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▸ <div>
              ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▾ <Parent>
                ▸ <div>
              ▾ <Parent>
                ▸ <div>
      `);

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <Parent>
              ▾ <Parent>
                ▸ <div>
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <div>
              ▸ <Parent>
              ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);
    });

    it('should support expanding deep parts of the tree', () => {
      const Wrapper = ({forwardedRef}) => (
        <Nested depth={3} forwardedRef={forwardedRef} />
      );
      const Nested = ({depth, forwardedRef}) =>
        depth > 0 ? (
          <Nested depth={depth - 1} forwardedRef={forwardedRef} />
        ) : (
          <div ref={forwardedRef} />
        );

      let ref = null;
      const refSetter = value => {
        ref = value;
      };

      act(() =>
        ReactDOM.render(
          <Wrapper forwardedRef={refSetter} />,
          document.createElement('div'),
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Wrapper>
      `);

      const deepestedNodeID = global.agent.getIDForNode(ref);

      act(() => store.toggleIsCollapsed(deepestedNodeID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <Nested>
              ▾ <Nested>
                ▾ <Nested>
                  ▾ <Nested>
                      <div>
      `);

      const rootID = store.getElementIDAtIndex(0);

      act(() => store.toggleIsCollapsed(rootID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Wrapper>
      `);

      act(() => store.toggleIsCollapsed(rootID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <Nested>
              ▾ <Nested>
                ▾ <Nested>
                  ▾ <Nested>
                      <div>
      `);

      const id = store.getElementIDAtIndex(1);

      act(() => store.toggleIsCollapsed(id, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▸ <Nested>
      `);

      act(() => store.toggleIsCollapsed(id, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <Nested>
              ▾ <Nested>
                ▾ <Nested>
                  ▾ <Nested>
                      <div>
      `);
    });

    it('should support reordering of children', () => {
      const Root = ({children}) => <div>{children}</div>;
      const Component = () => <div />;

      const Foo = () => <div>{[<Component key="0" />]}</div>;
      const Bar = () => (
        <div>{[<Component key="0" />, <Component key="1" />]}</div>
      );
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);

      act(() => ReactDOM.render(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▸ <div>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▸ <Bar key="bar">
              ▸ <Foo key="foo">
      `);

      act(() => {
        store.toggleIsCollapsed(store.getElementIDAtIndex(3), false);
        store.toggleIsCollapsed(store.getElementIDAtIndex(2), false);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <div>
              ▾ <Bar key="bar">
                ▸ <div>
              ▾ <Foo key="foo">
                ▸ <div>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);
    });
  });

  describe('StrictMode compliance', () => {
    it('should mark all elements as strict mode compliant', () => {
      const App = () => null;

      const container = document.createElement('div');
      act(() => ReactDOM.render(<App />, container));

      expect(store.getElementAtIndex(0).isStrictModeNonCompliant).toBe(false);
    });
  });
});
