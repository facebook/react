// @flow

describe('Store', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let store;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    store = global.store;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
  });

  it('should not allow a root node to be collapsed', () => {
    // TODO
  });

  describe('collapseNodesByDefault:false', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = false;
    });

    it('should support mount and update operations', () => {
      const Grandparent = ({ count }) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
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
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
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

    it('should filter DOM nodes from the store tree', () => {
      const Grandparent = () => (
        <div>
          <div>
            <Parent />
          </div>
          <Parent />
        </div>
      );
      const Parent = () => (
        <div>
          <Child />
        </div>
      );
      const Child = () => <div>Hi!</div>;

      act(() =>
        ReactDOM.render(
          <Grandparent count={4} />,
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');
    });

    it('should display Suspense nodes properly in various states', () => {
      const Loading = () => <div>Loading...</div>;
      const SuspendingComponent = () => {
        throw new Promise(() => {});
      };
      const Component = () => {
        return <div>Hello</div>;
      };
      const Wrapper = ({ shouldSuspense }) => (
        <React.Fragment>
          <Component key="Outside" />
          <React.Suspense fallback={<Loading />}>
            {shouldSuspense ? (
              <SuspendingComponent />
            ) : (
              <Component key="Inside" />
            )}
          </React.Suspense>
        </React.Fragment>
      );

      const container = document.createElement('div');
      act(() => ReactDOM.render(<Wrapper shouldSuspense={true} />, container));
      expect(store).toMatchSnapshot('1: loading');

      act(() => {
        ReactDOM.render(<Wrapper shouldSuspense={false} />, container);
      });
      expect(store).toMatchSnapshot('2: resolved');
    });

    it('should support collapsing parts of the tree', () => {
      const Grandparent = ({ count }) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      act(() =>
        ReactDOM.render(
          <Grandparent count={2} />,
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      const grandparentID = store.getElementIDAtIndex(0);
      const parentOneID = store.getElementIDAtIndex(1);
      const parentTwoID = store.getElementIDAtIndex(4);

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
  });

  describe('collapseNodesByDefault:true', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = true;
    });

    it('should support mount and update operations', () => {
      const Grandparent = ({ count }) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
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
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
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

    it('should filter DOM nodes from the store tree', () => {
      const Grandparent = () => (
        <div>
          <div>
            <Parent />
          </div>
          <Parent />
        </div>
      );
      const Parent = () => (
        <div>
          <Child />
        </div>
      );
      const Child = () => <div>Hi!</div>;

      act(() =>
        ReactDOM.render(
          <Grandparent count={4} />,
          document.createElement('div')
        )
      );
      expect(store).toMatchSnapshot('1: mount');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchSnapshot('2: expand Grandparent');

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchSnapshot('3: expand Parent');
    });

    it('should display Suspense nodes properly in various states', () => {
      const Loading = () => <div>Loading...</div>;
      const SuspendingComponent = () => {
        throw new Promise(() => {});
      };
      const Component = () => {
        return <div>Hello</div>;
      };
      const Wrapper = ({ shouldSuspense }) => (
        <React.Fragment>
          <Component key="Outside" />
          <React.Suspense fallback={<Loading />}>
            {shouldSuspense ? (
              <SuspendingComponent />
            ) : (
              <Component key="Inside" />
            )}
          </React.Suspense>
        </React.Fragment>
      );

      const container = document.createElement('div');
      act(() => ReactDOM.render(<Wrapper shouldSuspense={true} />, container));
      expect(store).toMatchSnapshot('1: loading');

      // This test isn't meaningful unless we expand the suspended tree
      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(2), false));
      expect(store).toMatchSnapshot('2: expand Wrapper and Suspense');

      act(() => {
        ReactDOM.render(<Wrapper shouldSuspense={false} />, container);
      });
      expect(store).toMatchSnapshot('2: resolved');
    });

    it('should support collapsing parts of the tree', () => {
      const Grandparent = ({ count }) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({ count }) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
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

      const parentOneID = store.getElementIDAtIndex(1);
      const parentTwoID = store.getElementIDAtIndex(2);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchSnapshot('3: expand first Parent');

      act(() => store.toggleIsCollapsed(parentTwoID, false));
      expect(store).toMatchSnapshot('4: expand second Parent');

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchSnapshot('5: collapse first Parent');

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchSnapshot('6: collapse second Parent');

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchSnapshot('7: collapse Grandparent');
    });
  });
});
