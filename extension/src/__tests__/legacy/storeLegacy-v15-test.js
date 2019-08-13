// @flow

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
      jest.requireActual('react-dom-15/dist/react-dom.js')
    );

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should not allow a root node to be collapsed', () => {
    const Component = () => <div>Hi</div>;

    act(() =>
      ReactDOM.render(<Component count={4} />, document.createElement('div'))
    );
    expect(store).toMatchSnapshot('1: mount');

    expect(store.roots).toHaveLength(1);

    const rootID = store.roots[0];

    expect(() => store.toggleIsCollapsed(rootID, true)).toThrow(
      'Root nodes cannot be collapsed'
    );
  });

  describe('collapseNodesByDefault:false', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = false;
    });

    it('should support mount and update operations', () => {
      const Grandparent = ({ count }) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({ count }) => (
        <div>
          {new Array(count).fill(true).map((_, index) => (
            <Child key={index} />
          ))}
        </div>
      );
      const Child = () => <div>Hi!</div>;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Grandparent count={4} />, container));
      expect(store).toMatchSnapshot('1: mount');

      act(() => ReactDOM.render(<Grandparent count={2} />, container));
      expect(store).toMatchSnapshot('2: update');

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchSnapshot('3: unmount');
    });

    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({ count }) => (
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
      expect(store).toMatchSnapshot('1: mount');

      act(() => {
        ReactDOM.render(<Parent key="A" count={4} />, containerA);
        ReactDOM.render(<Parent key="B" count={1} />, containerB);
      });
      expect(store).toMatchSnapshot('2: update');

      act(() => ReactDOM.unmountComponentAtNode(containerB));
      expect(store).toMatchSnapshot('3: unmount B');

      act(() => ReactDOM.unmountComponentAtNode(containerA));
      expect(store).toMatchSnapshot('4: unmount A');
    });

    it('should not filter DOM nodes from the store tree', () => {
      const Grandparent = ({ flip }) => (
        <div>
          <div>
            <Parent flip={flip} />
          </div>
          <Parent flip={flip} />
          <Nothing />
        </div>
      );
      const Parent = ({ flip }) => (
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
        ReactDOM.render(<Grandparent count={4} flip={false} />, container)
      );
      expect(store).toMatchSnapshot('1: mount');

      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={true} />, container)
      );
      expect(store).toMatchSnapshot('2: update');

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchSnapshot('5: unmount');
    });

    it('should support collapsing parts of the tree', () => {
      const Grandparent = ({ count }) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({ count }) => (
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
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      const grandparentID = store.getElementIDAtIndex(0);
      const parentOneID = store.getElementIDAtIndex(2);
      const parentTwoID = store.getElementIDAtIndex(8);

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchSnapshot('2: collapse first Parent');

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchSnapshot('3: collapse second Parent');

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchSnapshot('4: expand first Parent');

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchSnapshot('5: collapse Grandparent');

      act(() => store.toggleIsCollapsed(grandparentID, false));
      expect(store).toMatchSnapshot('6: expand Grandparent');
    });

    it('should support adding and removing children', () => {
      const Root = ({ children }) => <div>{children}</div>;
      const Component = () => <div />;

      const container = document.createElement('div');

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="a" />
          </Root>,
          container
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="a" />
            <Component key="b" />
          </Root>,
          container
        )
      );
      expect(store).toMatchSnapshot('2: add child');

      act(() =>
        ReactDOM.render(
          <Root>
            <Component key="b" />
          </Root>,
          container
        )
      );
      expect(store).toMatchSnapshot('3: remove child');
    });

    it('should support reordering of children', () => {
      const Root = ({ children }) => <div>{children}</div>;
      const Component = () => <div />;

      const Foo = () => <div>{[<Component key="0" />]}</div>;
      const Bar = () => (
        <div>{[<Component key="0" />, <Component key="1" />]}</div>
      );
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchSnapshot('1: mount');

      act(() => ReactDOM.render(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchSnapshot('2: reorder children');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), true));
      expect(store).toMatchSnapshot('3: collapse root');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchSnapshot('4: expand root');
    });
  });

  describe('collapseNodesByDefault:true', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = true;
    });

    it('should support mount and update operations', () => {
      const Parent = ({ count }) => (
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
          container
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      act(() =>
        ReactDOM.render(
          <div>
            <Parent count={2} />
            <Parent count={1} />
          </div>,
          container
        )
      );
      expect(store).toMatchSnapshot('2: update');

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchSnapshot('3: unmount');
    });

    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({ count }) => (
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
      expect(store).toMatchSnapshot('1: mount');

      act(() => {
        ReactDOM.render(<Parent key="A" count={4} />, containerA);
        ReactDOM.render(<Parent key="B" count={1} />, containerB);
      });
      expect(store).toMatchSnapshot('2: update');

      act(() => ReactDOM.unmountComponentAtNode(containerB));
      expect(store).toMatchSnapshot('3: unmount B');

      act(() => ReactDOM.unmountComponentAtNode(containerA));
      expect(store).toMatchSnapshot('4: unmount A');
    });

    it('should not filter DOM nodes from the store tree', () => {
      const Grandparent = ({ flip }) => (
        <div>
          <div>
            <Parent flip={flip} />
          </div>
          <Parent flip={flip} />
          <Nothing />
        </div>
      );
      const Parent = ({ flip }) => (
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
        ReactDOM.render(<Grandparent count={4} flip={false} />, container)
      );
      expect(store).toMatchSnapshot('1: mount');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchSnapshot('2: expand Grandparent');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchSnapshot('3: expand div');

      act(() =>
        ReactDOM.render(<Grandparent count={4} flip={true} />, container)
      );
      expect(store).toMatchSnapshot('4: final update');

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchSnapshot('5: unmount');
    });

    it('should support expanding parts of the tree', () => {
      const Grandparent = ({ count }) => (
        <div>
          <Parent count={count} />
          <Parent count={count} />
        </div>
      );
      const Parent = ({ count }) => (
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
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      const grandparentID = store.getElementIDAtIndex(0);

      act(() => store.toggleIsCollapsed(grandparentID, false));
      expect(store).toMatchSnapshot('2: expand Grandparent');

      const parentDivID = store.getElementIDAtIndex(1);
      act(() => store.toggleIsCollapsed(parentDivID, false));
      expect(store).toMatchSnapshot('3: expand parent div');

      const parentOneID = store.getElementIDAtIndex(2);
      const parentTwoID = store.getElementIDAtIndex(3);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchSnapshot('4: expand first Parent');

      act(() => store.toggleIsCollapsed(parentTwoID, false));
      expect(store).toMatchSnapshot('5: expand second Parent');

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchSnapshot('6: collapse first Parent');

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchSnapshot('7: collapse second Parent');

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchSnapshot('8: collapse Grandparent');
    });

    it('should support expanding deep parts of the tree', () => {
      const Wrapper = ({ forwardedRef }) => (
        <Nested depth={3} forwardedRef={forwardedRef} />
      );
      const Nested = ({ depth, forwardedRef }) =>
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
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      const deepestedNodeID = global.agent.getIDForNode(ref);

      act(() => store.toggleIsCollapsed(deepestedNodeID, false));
      expect(store).toMatchSnapshot('2: expand deepest node');

      const rootID = store.getElementIDAtIndex(0);

      act(() => store.toggleIsCollapsed(rootID, true));
      expect(store).toMatchSnapshot('3: collapse root');

      act(() => store.toggleIsCollapsed(rootID, false));
      expect(store).toMatchSnapshot('4: expand root');

      const id = store.getElementIDAtIndex(1);

      act(() => store.toggleIsCollapsed(id, true));
      expect(store).toMatchSnapshot('5: collapse middle node');

      act(() => store.toggleIsCollapsed(id, false));
      expect(store).toMatchSnapshot('6: expand middle node');
    });

    it('should support reordering of children', () => {
      const Root = ({ children }) => <div>{children}</div>;
      const Component = () => <div />;

      const Foo = () => <div>{[<Component key="0" />]}</div>;
      const Bar = () => (
        <div>{[<Component key="0" />, <Component key="1" />]}</div>
      );
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => ReactDOM.render(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchSnapshot('1: mount');

      act(() => ReactDOM.render(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchSnapshot('2: reorder children');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchSnapshot('3: expand root');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchSnapshot('4: expand div');

      act(() => {
        store.toggleIsCollapsed(store.getElementIDAtIndex(3), false);
        store.toggleIsCollapsed(store.getElementIDAtIndex(2), false);
      });
      expect(store).toMatchSnapshot('4: expand leaves');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), true));
      expect(store).toMatchSnapshot('5: collapse root');
    });
  });
});
