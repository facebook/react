/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('Store', () => {
  let React;
  let ReactDOM;
  let ReactDOMClient;
  let agent;
  let act;
  let actAsync;
  let bridge;
  let getRendererID;
  let legacyRender;
  let store;
  let withErrorsOrWarningsIgnored;

  beforeEach(() => {
    agent = global.agent;
    bridge = global.bridge;
    store = global.store;

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMClient = require('react-dom/client');

    const utils = require('./utils');
    act = utils.act;
    actAsync = utils.actAsync;
    getRendererID = utils.getRendererID;
    legacyRender = utils.legacyRender;
    withErrorsOrWarningsIgnored = utils.withErrorsOrWarningsIgnored;
  });

  // @reactVersion >= 18.0
  it('should not allow a root node to be collapsed', () => {
    const Component = () => <div>Hi</div>;

    act(() =>
      legacyRender(<Component count={4} />, document.createElement('div')),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Component>
    `);

    expect(store.roots).toHaveLength(1);

    const rootID = store.roots[0];

    expect(() => store.toggleIsCollapsed(rootID, true)).toThrow(
      'Root nodes cannot be collapsed',
    );
  });

  // @reactVersion >= 18.0
  it('should properly handle a root with no visible nodes', () => {
    const Root = ({children}) => children;

    const container = document.createElement('div');

    act(() => legacyRender(<Root>{null}</Root>, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Root>
    `);

    act(() => legacyRender(<div />, container));
    expect(store).toMatchInlineSnapshot(`[root]`);
  });

  // This test is not the same cause as what's reported on GitHub,
  // but the resulting behavior (owner mounting after descendant) is the same.
  // Thec ase below is admittedly contrived and relies on side effects.
  // I'mnot yet sure of how to reduce the GitHub reported production case to a test though.
  // See https://github.com/facebook/react/issues/21445
  // @reactVersion >= 18.0
  it('should handle when a component mounts before its owner', () => {
    const promise = new Promise(resolve => {});

    let Dynamic = null;
    const Owner = () => {
      Dynamic = <Child />;
      throw promise;
    };
    const Parent = () => {
      return Dynamic;
    };
    const Child = () => null;

    const container = document.createElement('div');

    act(() =>
      legacyRender(
        <>
          <React.Suspense fallback="Loading...">
            <Owner />
          </React.Suspense>
          <Parent />
        </>,
        container,
      ),
    );
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Suspense>
        ▾ <Parent>
            <Child>
    `);
  });

  // @reactVersion >= 18.0
  it('should handle multibyte character strings', () => {
    const Component = () => null;
    Component.displayName = '🟩💜🔵';

    const container = document.createElement('div');

    act(() => legacyRender(<Component />, container));
    expect(store).toMatchInlineSnapshot(`
      [root]
          <🟩💜🔵>
    `);
  });

  describe('StrictMode compliance', () => {
    it('should mark strict root elements as strict', () => {
      const App = () => <Component />;
      const Component = () => null;

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container, {
        unstable_strictMode: true,
      });
      act(() => {
        root.render(<App />);
      });

      expect(store.getElementAtIndex(0).isStrictModeNonCompliant).toBe(false);
      expect(store.getElementAtIndex(1).isStrictModeNonCompliant).toBe(false);
    });

    // @reactVersion >= 18.0
    it('should mark non strict root elements as not strict', () => {
      const App = () => <Component />;
      const Component = () => null;

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      act(() => {
        root.render(<App />);
      });

      expect(store.getElementAtIndex(0).isStrictModeNonCompliant).toBe(true);
      expect(store.getElementAtIndex(1).isStrictModeNonCompliant).toBe(true);
    });

    it('should mark StrictMode subtree elements as strict', () => {
      const App = () => (
        <React.StrictMode>
          <Component />
        </React.StrictMode>
      );
      const Component = () => null;

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      act(() => {
        root.render(<App />);
      });

      expect(store.getElementAtIndex(0).isStrictModeNonCompliant).toBe(true);
      expect(store.getElementAtIndex(1).isStrictModeNonCompliant).toBe(false);
    });
  });

  describe('collapseNodesByDefault:false', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = false;
    });

    // @reactVersion >= 18.0
    it('should support mount and update operations', () => {
      const Grandparent = ({count}) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      const container = document.createElement('div');

      act(() => legacyRender(<Grandparent count={4} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
                <Child key="2">
                <Child key="3">
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
                <Child key="2">
                <Child key="3">
      `);

      act(() => legacyRender(<Grandparent count={2} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    // @reactVersion >= 18.0
    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      const containerA = document.createElement('div');
      const containerB = document.createElement('div');

      act(() => {
        legacyRender(<Parent key="A" count={3} />, containerA);
        legacyRender(<Parent key="B" count={2} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
              <Child key="0">
              <Child key="1">
              <Child key="2">
        [root]
          ▾ <Parent key="B">
              <Child key="0">
              <Child key="1">
      `);

      act(() => {
        legacyRender(<Parent key="A" count={4} />, containerA);
        legacyRender(<Parent key="B" count={1} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
              <Child key="0">
              <Child key="1">
              <Child key="2">
              <Child key="3">
        [root]
          ▾ <Parent key="B">
              <Child key="0">
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerB));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Parent key="A">
              <Child key="0">
              <Child key="1">
              <Child key="2">
              <Child key="3">
      `);

      act(() => ReactDOM.unmountComponentAtNode(containerA));
      expect(store).toMatchInlineSnapshot(``);
    });

    // @reactVersion >= 18.0
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
        legacyRender(<Grandparent count={4} />, document.createElement('div')),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child>
            ▾ <Parent>
                <Child>
      `);
    });

    // @reactVersion >= 18.0
    it('should display Suspense nodes properly in various states', () => {
      const Loading = () => <div>Loading...</div>;
      const SuspendingComponent = () => {
        throw new Promise(() => {});
      };
      const Component = () => {
        return <div>Hello</div>;
      };
      const Wrapper = ({shouldSuspense}) => (
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
      act(() => legacyRender(<Wrapper shouldSuspense={true} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Loading>
      `);

      act(() => {
        legacyRender(<Wrapper shouldSuspense={false} />, container);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Inside">
      `);
    });

    // @reactVersion >= 18.0
    it('should support nested Suspense nodes', () => {
      const Component = () => null;
      const Loading = () => <div>Loading...</div>;
      const Never = () => {
        throw new Promise(() => {});
      };

      const Wrapper = ({
        suspendFirst = false,
        suspendSecond = false,
        suspendParent = false,
      }) => (
        <React.Fragment>
          <Component key="Outside" />
          <React.Suspense fallback={<Loading key="Parent Fallback" />}>
            <Component key="Unrelated at Start" />
            <React.Suspense fallback={<Loading key="Suspense 1 Fallback" />}>
              {suspendFirst ? (
                <Never />
              ) : (
                <Component key="Suspense 1 Content" />
              )}
            </React.Suspense>
            <React.Suspense fallback={<Loading key="Suspense 2 Fallback" />}>
              {suspendSecond ? (
                <Never />
              ) : (
                <Component key="Suspense 2 Content" />
              )}
            </React.Suspense>
            <React.Suspense fallback={<Loading key="Suspense 3 Fallback" />}>
              <Never />
            </React.Suspense>
            {suspendParent && <Never />}
            <Component key="Unrelated at End" />
          </React.Suspense>
        </React.Fragment>
      );

      const container = document.createElement('div');
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={false}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Component key="Suspense 1 Content">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={true}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={false}
            suspendSecond={true}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Component key="Suspense 1 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 2 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={true}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={true}
            suspendFirst={true}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Loading key="Parent Fallback">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={true}
            suspendSecond={true}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 2 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={false}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Component key="Suspense 1 Content">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);

      const rendererID = getRendererID();
      act(() =>
        agent.overrideSuspense({
          id: store.getElementIDAtIndex(4),
          rendererID,
          forceFallback: true,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        agent.overrideSuspense({
          id: store.getElementIDAtIndex(2),
          rendererID,
          forceFallback: true,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Loading key="Parent Fallback">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={true}
            suspendSecond={true}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Loading key="Parent Fallback">
      `);
      act(() =>
        agent.overrideSuspense({
          id: store.getElementIDAtIndex(2),
          rendererID,
          forceFallback: false,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 2 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        agent.overrideSuspense({
          id: store.getElementIDAtIndex(4),
          rendererID,
          forceFallback: false,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Loading key="Suspense 1 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 2 Fallback">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
      act(() =>
        legacyRender(
          <Wrapper
            suspendParent={false}
            suspendFirst={false}
            suspendSecond={false}
          />,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Unrelated at Start">
              ▾ <Suspense>
                  <Component key="Suspense 1 Content">
              ▾ <Suspense>
                  <Component key="Suspense 2 Content">
              ▾ <Suspense>
                  <Loading key="Suspense 3 Fallback">
                <Component key="Unrelated at End">
      `);
    });

    it('should display a partially rendered SuspenseList', () => {
      const Loading = () => <div>Loading...</div>;
      const SuspendingComponent = () => {
        throw new Promise(() => {});
      };
      const Component = () => {
        return <div>Hello</div>;
      };
      const Wrapper = ({shouldSuspense}) => (
        <React.Fragment>
          <React.SuspenseList revealOrder="forwards" tail="collapsed">
            <Component key="A" />
            <React.Suspense fallback={<Loading />}>
              {shouldSuspense ? <SuspendingComponent /> : <Component key="B" />}
            </React.Suspense>
            <Component key="C" />
          </React.SuspenseList>
        </React.Fragment>
      );

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      act(() => {
        root.render(<Wrapper shouldSuspense={true} />);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <SuspenseList>
                <Component key="A">
              ▾ <Suspense>
                  <Loading>
      `);

      act(() => {
        root.render(<Wrapper shouldSuspense={false} />);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <SuspenseList>
                <Component key="A">
              ▾ <Suspense>
                  <Component key="B">
                <Component key="C">
      `);
    });

    // @reactVersion >= 18.0
    it('should support collapsing parts of the tree', () => {
      const Grandparent = ({count}) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      act(() =>
        legacyRender(<Grandparent count={2} />, document.createElement('div')),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
      `);

      const grandparentID = store.getElementIDAtIndex(0);
      const parentOneID = store.getElementIDAtIndex(1);
      const parentTwoID = store.getElementIDAtIndex(4);

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <Parent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <Parent>
            ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
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
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
            ▸ <Parent>
      `);
    });

    // @reactVersion >= 18.0
    it('should support reordering of children', () => {
      const Root = ({children}) => children;
      const Component = () => null;

      const Foo = () => [<Component key="0" />];
      const Bar = () => [<Component key="0" />, <Component key="1" />];
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => legacyRender(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <Foo key="foo">
                <Component key="0">
            ▾ <Bar key="bar">
                <Component key="0">
                <Component key="1">
      `);

      act(() => legacyRender(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <Bar key="bar">
                <Component key="0">
                <Component key="1">
            ▾ <Foo key="foo">
                <Component key="0">
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
            ▾ <Bar key="bar">
                <Component key="0">
                <Component key="1">
            ▾ <Foo key="foo">
                <Component key="0">
      `);
    });
  });

  describe('collapseNodesByDefault:true', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = true;
    });

    // @reactVersion >= 18.0
    it('should support mount and update operations', () => {
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      const container = document.createElement('div');

      act(() =>
        legacyRender(
          <React.Fragment>
            <Parent count={1} />
            <Parent count={3} />
          </React.Fragment>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent>
          ▸ <Parent>
      `);

      act(() =>
        legacyRender(
          <React.Fragment>
            <Parent count={2} />
            <Parent count={1} />
          </React.Fragment>,
          container,
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent>
          ▸ <Parent>
      `);

      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(store).toMatchInlineSnapshot(``);
    });

    // @reactVersion >= 18.0
    it('should support mount and update operations for multiple roots', () => {
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      const containerA = document.createElement('div');
      const containerB = document.createElement('div');

      act(() => {
        legacyRender(<Parent key="A" count={3} />, containerA);
        legacyRender(<Parent key="B" count={2} />, containerB);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Parent key="A">
        [root]
          ▸ <Parent key="B">
      `);

      act(() => {
        legacyRender(<Parent key="A" count={4} />, containerA);
        legacyRender(<Parent key="B" count={1} />, containerB);
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

    // @reactVersion >= 18.0
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
        legacyRender(<Grandparent count={4} />, document.createElement('div')),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <Parent>
            ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child>
            ▸ <Parent>
      `);
    });

    // @reactVersion >= 18.0
    it('should display Suspense nodes properly in various states', () => {
      const Loading = () => <div>Loading...</div>;
      const SuspendingComponent = () => {
        throw new Promise(() => {});
      };
      const Component = () => {
        return <div>Hello</div>;
      };
      const Wrapper = ({shouldSuspense}) => (
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
      act(() => legacyRender(<Wrapper shouldSuspense={true} />, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Wrapper>
      `);

      // This test isn't meaningful unless we expand the suspended tree
      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(2), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Loading>
      `);

      act(() => {
        legacyRender(<Wrapper shouldSuspense={false} />, container);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
              <Component key="Outside">
            ▾ <Suspense>
                <Component key="Inside">
      `);
    });

    // @reactVersion >= 18.0
    it('should support expanding parts of the tree', () => {
      const Grandparent = ({count}) => (
        <React.Fragment>
          <Parent count={count} />
          <Parent count={count} />
        </React.Fragment>
      );
      const Parent = ({count}) =>
        new Array(count).fill(true).map((_, index) => <Child key={index} />);
      const Child = () => <div>Hi!</div>;

      act(() =>
        legacyRender(<Grandparent count={2} />, document.createElement('div')),
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
            ▸ <Parent>
            ▸ <Parent>
      `);

      const parentOneID = store.getElementIDAtIndex(1);
      const parentTwoID = store.getElementIDAtIndex(2);

      act(() => store.toggleIsCollapsed(parentOneID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
            ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
      `);

      act(() => store.toggleIsCollapsed(parentOneID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <Parent>
            ▾ <Parent>
                <Child key="0">
                <Child key="1">
      `);

      act(() => store.toggleIsCollapsed(parentTwoID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Grandparent>
            ▸ <Parent>
            ▸ <Parent>
      `);

      act(() => store.toggleIsCollapsed(grandparentID, true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Grandparent>
      `);
    });

    // @reactVersion >= 18.0
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

      const ref = React.createRef();

      act(() =>
        legacyRender(
          <Wrapper forwardedRef={ref} />,
          document.createElement('div'),
        ),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Wrapper>
      `);

      const deepestedNodeID = agent.getIDForNode(ref.current);

      act(() => store.toggleIsCollapsed(deepestedNodeID, false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Wrapper>
            ▾ <Nested>
              ▾ <Nested>
                ▾ <Nested>
                    <Nested>
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
                    <Nested>
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
                    <Nested>
      `);
    });

    // @reactVersion >= 18.0
    it('should support reordering of children', () => {
      const Root = ({children}) => children;
      const Component = () => null;

      const Foo = () => [<Component key="0" />];
      const Bar = () => [<Component key="0" />, <Component key="1" />];
      const foo = <Foo key="foo" />;
      const bar = <Bar key="bar" />;

      const container = document.createElement('div');

      act(() => legacyRender(<Root>{[foo, bar]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);

      act(() => legacyRender(<Root>{[bar, foo]}</Root>, container));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▸ <Bar key="bar">
            ▸ <Foo key="foo">
      `);

      act(() => {
        store.toggleIsCollapsed(store.getElementIDAtIndex(2), false);
        store.toggleIsCollapsed(store.getElementIDAtIndex(1), false);
      });
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <Root>
            ▾ <Bar key="bar">
                <Component key="0">
                <Component key="1">
            ▾ <Foo key="foo">
                <Component key="0">
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), true));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <Root>
      `);
    });

    // @reactVersion >= 18.0
    it('should not add new nodes when suspense is toggled', () => {
      const SuspenseTree = () => {
        return (
          <React.Suspense fallback={<Fallback>Loading outer</Fallback>}>
            <Parent />
          </React.Suspense>
        );
      };

      const Fallback = () => null;
      const Parent = () => <Child />;
      const Child = () => null;

      act(() => legacyRender(<SuspenseTree />, document.createElement('div')));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▸ <SuspenseTree>
      `);

      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(0), false));
      act(() => store.toggleIsCollapsed(store.getElementIDAtIndex(1), false));
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <SuspenseTree>
            ▾ <Suspense>
              ▸ <Parent>
      `);

      const rendererID = getRendererID();
      const suspenseID = store.getElementIDAtIndex(1);

      act(() =>
        agent.overrideSuspense({
          id: suspenseID,
          rendererID,
          forceFallback: true,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <SuspenseTree>
            ▾ <Suspense>
                <Fallback>
      `);

      act(() =>
        agent.overrideSuspense({
          id: suspenseID,
          rendererID,
          forceFallback: false,
        }),
      );
      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <SuspenseTree>
            ▾ <Suspense>
              ▸ <Parent>
      `);
    });
  });

  describe('getIndexOfElementID', () => {
    beforeEach(() => {
      store.collapseNodesByDefault = false;
    });

    // @reactVersion >= 18.0
    it('should support a single root with a single child', () => {
      const Grandparent = () => (
        <React.Fragment>
          <Parent />
          <Parent />
        </React.Fragment>
      );
      const Parent = () => <Child />;
      const Child = () => null;

      act(() => legacyRender(<Grandparent />, document.createElement('div')));

      for (let i = 0; i < store.numElements; i++) {
        expect(store.getIndexOfElementID(store.getElementIDAtIndex(i))).toBe(i);
      }
    });

    // @reactVersion >= 18.0
    it('should support multiple roots with one children each', () => {
      const Grandparent = () => <Parent />;
      const Parent = () => <Child />;
      const Child = () => null;

      act(() => {
        legacyRender(<Grandparent />, document.createElement('div'));
        legacyRender(<Grandparent />, document.createElement('div'));
      });

      for (let i = 0; i < store.numElements; i++) {
        expect(store.getIndexOfElementID(store.getElementIDAtIndex(i))).toBe(i);
      }
    });

    // @reactVersion >= 18.0
    it('should support a single root with multiple top level children', () => {
      const Grandparent = () => <Parent />;
      const Parent = () => <Child />;
      const Child = () => null;

      act(() =>
        legacyRender(
          <React.Fragment>
            <Grandparent />
            <Grandparent />
          </React.Fragment>,
          document.createElement('div'),
        ),
      );

      for (let i = 0; i < store.numElements; i++) {
        expect(store.getIndexOfElementID(store.getElementIDAtIndex(i))).toBe(i);
      }
    });

    // @reactVersion >= 18.0
    it('should support multiple roots with multiple top level children', () => {
      const Grandparent = () => <Parent />;
      const Parent = () => <Child />;
      const Child = () => null;

      act(() => {
        legacyRender(
          <React.Fragment>
            <Grandparent />
            <Grandparent />
          </React.Fragment>,
          document.createElement('div'),
        );
        legacyRender(
          <React.Fragment>
            <Grandparent />
            <Grandparent />
          </React.Fragment>,
          document.createElement('div'),
        );
      });

      for (let i = 0; i < store.numElements; i++) {
        expect(store.getIndexOfElementID(store.getElementIDAtIndex(i))).toBe(i);
      }
    });
  });

  // @reactVersion >= 18.0
  it('detects and updates profiling support based on the attached roots', () => {
    const Component = () => null;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    expect(store.rootSupportsBasicProfiling).toBe(false);

    act(() => legacyRender(<Component />, containerA));
    expect(store.rootSupportsBasicProfiling).toBe(true);

    act(() => legacyRender(<Component />, containerB));
    act(() => ReactDOM.unmountComponentAtNode(containerA));
    expect(store.rootSupportsBasicProfiling).toBe(true);

    act(() => ReactDOM.unmountComponentAtNode(containerB));
    expect(store.rootSupportsBasicProfiling).toBe(false);
  });

  // @reactVersion >= 18.0
  it('should properly serialize non-string key values', () => {
    const Child = () => null;

    // Bypass React element's automatic stringifying of keys intentionally.
    // This is pretty hacky.
    const fauxElement = Object.assign({}, <Child />, {key: 123});

    act(() => legacyRender([fauxElement], document.createElement('div')));
    expect(store).toMatchInlineSnapshot(`
      [root]
          <Child key="123">
    `);
  });

  it('should show the right display names for special component types', async () => {
    const MyComponent = (props, ref) => null;
    const ForwardRefComponent = React.forwardRef(MyComponent);
    const MyComponent2 = (props, ref) => null;
    const ForwardRefComponentWithAnonymousFunction = React.forwardRef(() => (
      <MyComponent2 />
    ));
    const MyComponent3 = (props, ref) => null;
    const ForwardRefComponentWithCustomDisplayName = React.forwardRef(
      MyComponent3,
    );
    ForwardRefComponentWithCustomDisplayName.displayName = 'Custom';
    const MyComponent4 = (props, ref) => null;
    const MemoComponent = React.memo(MyComponent4);
    const MemoForwardRefComponent = React.memo(ForwardRefComponent);

    const FakeHigherOrderComponent = () => null;
    FakeHigherOrderComponent.displayName = 'withFoo(withBar(Baz))';

    const MemoizedFakeHigherOrderComponent = React.memo(
      FakeHigherOrderComponent,
    );
    const ForwardRefFakeHigherOrderComponent = React.forwardRef(
      FakeHigherOrderComponent,
    );

    const MemoizedFakeHigherOrderComponentWithDisplayNameOverride = React.memo(
      FakeHigherOrderComponent,
    );
    MemoizedFakeHigherOrderComponentWithDisplayNameOverride.displayName =
      'memoRefOverride';
    const ForwardRefFakeHigherOrderComponentWithDisplayNameOverride = React.forwardRef(
      FakeHigherOrderComponent,
    );
    ForwardRefFakeHigherOrderComponentWithDisplayNameOverride.displayName =
      'forwardRefOverride';

    const App = () => (
      <React.Fragment>
        <MyComponent />
        <ForwardRefComponent />
        <ForwardRefComponentWithAnonymousFunction />
        <ForwardRefComponentWithCustomDisplayName />
        <MemoComponent />
        <MemoForwardRefComponent />
        <FakeHigherOrderComponent />
        <MemoizedFakeHigherOrderComponent />
        <ForwardRefFakeHigherOrderComponent />
        <React.unstable_Cache />
        <MemoizedFakeHigherOrderComponentWithDisplayNameOverride />
        <ForwardRefFakeHigherOrderComponentWithDisplayNameOverride />
      </React.Fragment>
    );

    const container = document.createElement('div');

    // Render once to start fetching the lazy component
    act(() => legacyRender(<App />, container));

    await Promise.resolve();

    // Render again after it resolves
    act(() => legacyRender(<App />, container));

    expect(store).toMatchInlineSnapshot(`
      [root]
        ▾ <App>
            <MyComponent>
            <MyComponent> [ForwardRef]
          ▾ <Anonymous> [ForwardRef]
              <MyComponent2>
            <Custom>
            <MyComponent4> [Memo]
          ▾ <MyComponent> [Memo]
              <MyComponent> [ForwardRef]
            <Baz> [withFoo][withBar]
            <Baz> [Memo][withFoo][withBar]
            <Baz> [ForwardRef][withFoo][withBar]
            <Cache>
            <memoRefOverride>
            <forwardRefOverride>
    `);
  });

  describe('Lazy', () => {
    async function fakeImport(result) {
      return {default: result};
    }

    const LazyInnerComponent = () => null;

    const App = ({renderChildren}) => {
      if (renderChildren) {
        return (
          <React.Suspense fallback="Loading...">
            <LazyComponent />
          </React.Suspense>
        );
      } else {
        return null;
      }
    };

    let LazyComponent;
    beforeEach(() => {
      LazyComponent = React.lazy(() => fakeImport(LazyInnerComponent));
    });

    // @reactVersion >= 18.0
    it('should support Lazy components (legacy render)', async () => {
      const container = document.createElement('div');

      // Render once to start fetching the lazy component
      act(() => legacyRender(<App renderChildren={true} />, container));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);

      await Promise.resolve();

      // Render again after it resolves
      act(() => legacyRender(<App renderChildren={true} />, container));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
            ▾ <Suspense>
                <LazyInnerComponent>
      `);

      // Render again to unmount it
      act(() => legacyRender(<App renderChildren={false} />, container));

      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
    });

    // @reactVersion >= 18.0
    it('should support Lazy components in (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      // Render once to start fetching the lazy component
      act(() => root.render(<App renderChildren={true} />));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);

      await Promise.resolve();

      // Render again after it resolves
      act(() => root.render(<App renderChildren={true} />));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
            ▾ <Suspense>
                <LazyInnerComponent>
      `);

      // Render again to unmount it
      act(() => root.render(<App renderChildren={false} />));

      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
    });

    // @reactVersion >= 18.0
    it('should support Lazy components that are unmounted before they finish loading (legacy render)', async () => {
      const container = document.createElement('div');

      // Render once to start fetching the lazy component
      act(() => legacyRender(<App renderChildren={true} />, container));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);

      // Render again to unmount it before it finishes loading
      act(() => legacyRender(<App renderChildren={false} />, container));

      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
    });

    // @reactVersion >= 18.0
    it('should support Lazy components that are unmounted before they finish loading in (createRoot)', async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      // Render once to start fetching the lazy component
      act(() => root.render(<App renderChildren={true} />));

      expect(store).toMatchInlineSnapshot(`
        [root]
          ▾ <App>
              <Suspense>
      `);

      // Render again to unmount it before it finishes loading
      act(() => root.render(<App renderChildren={false} />));

      expect(store).toMatchInlineSnapshot(`
        [root]
            <App>
      `);
    });
  });

  describe('inline errors and warnings', () => {
    // @reactVersion >= 18.0
    it('during render are counted', () => {
      function Example() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }
      const container = document.createElement('div');

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() => legacyRender(<Example />, container));
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 1
        [root]
            <Example> ✕⚠
      `);

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() => legacyRender(<Example rerender={1} />, container));
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <Example> ✕⚠
      `);
    });

    // @reactVersion >= 18.0
    it('during layout get counted', () => {
      function Example() {
        React.useLayoutEffect(() => {
          console.error('test-only: layout error');
          console.warn('test-only: layout warning');
        });
        return null;
      }
      const container = document.createElement('div');

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() => legacyRender(<Example />, container));
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 1
        [root]
            <Example> ✕⚠
      `);

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() => legacyRender(<Example rerender={1} />, container));
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <Example> ✕⚠
      `);
    });

    describe('during passive effects', () => {
      function flushPendingBridgeOperations() {
        jest.runOnlyPendingTimers();
      }

      // Gross abstraction around pending passive warning/error delay.
      function flushPendingPassiveErrorAndWarningCounts() {
        jest.advanceTimersByTime(1000);
      }

      // @reactVersion >= 18.0
      it('are counted (after a delay)', () => {
        function Example() {
          React.useEffect(() => {
            console.error('test-only: passive error');
            console.warn('test-only: passive warning');
          });
          return null;
        }
        const container = document.createElement('div');

        withErrorsOrWarningsIgnored(['test-only:'], () => {
          act(() => {
            legacyRender(<Example />, container);
          }, false);
        });
        flushPendingBridgeOperations();
        expect(store).toMatchInlineSnapshot(`
          [root]
              <Example>
        `);

        // After a delay, passive effects should be committed as well
        act(flushPendingPassiveErrorAndWarningCounts, false);
        expect(store).toMatchInlineSnapshot(`
          ✕ 1, ⚠ 1
          [root]
              <Example> ✕⚠
        `);

        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(store).toMatchInlineSnapshot(``);
      });

      // @reactVersion >= 18.0
      it('are flushed early when there is a new commit', () => {
        function Example() {
          React.useEffect(() => {
            console.error('test-only: passive error');
            console.warn('test-only: passive warning');
          });
          return null;
        }

        function Noop() {
          return null;
        }

        const container = document.createElement('div');

        withErrorsOrWarningsIgnored(['test-only:'], () => {
          act(() => {
            legacyRender(
              <>
                <Example />
              </>,
              container,
            );
          }, false);
          flushPendingBridgeOperations();
          expect(store).toMatchInlineSnapshot(`
            [root]
                <Example>
          `);

          // Before warnings and errors have flushed, flush another commit.
          act(() => {
            legacyRender(
              <>
                <Example />
                <Noop />
              </>,
              container,
            );
          }, false);
          flushPendingBridgeOperations();
          expect(store).toMatchInlineSnapshot(`
            ✕ 1, ⚠ 1
            [root]
                <Example> ✕⚠
                <Noop>
          `);
        });

        // After a delay, passive effects should be committed as well
        act(flushPendingPassiveErrorAndWarningCounts, false);
        expect(store).toMatchInlineSnapshot(`
          ✕ 2, ⚠ 2
          [root]
              <Example> ✕⚠
              <Noop>
        `);

        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(store).toMatchInlineSnapshot(``);
      });
    });

    // @reactVersion >= 18.0
    it('from react get counted', () => {
      const container = document.createElement('div');
      function Example() {
        return [<Child />];
      }
      function Child() {
        return null;
      }

      withErrorsOrWarningsIgnored(
        ['Warning: Each child in a list should have a unique "key" prop'],
        () => {
          act(() => legacyRender(<Example />, container));
        },
      );

      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 0
        [root]
          ▾ <Example> ✕
              <Child>
      `);
    });

    // @reactVersion >= 18.0
    it('can be cleared for the whole app', () => {
      function Example() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }
      const container = document.createElement('div');
      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <Example />
              <Example />
            </React.Fragment>,
            container,
          ),
        );
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <Example> ✕⚠
            <Example> ✕⚠
      `);

      const {
        clearErrorsAndWarnings,
      } = require('react-devtools-shared/src/backendAPI');
      clearErrorsAndWarnings({bridge, store});

      // flush events to the renderer
      jest.runAllTimers();

      expect(store).toMatchInlineSnapshot(`
        [root]
            <Example>
            <Example>
      `);
    });

    // @reactVersion >= 18.0
    it('can be cleared for particular Fiber (only warnings)', () => {
      function Example() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }
      const container = document.createElement('div');
      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <Example />
              <Example />
            </React.Fragment>,
            container,
          ),
        );
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <Example> ✕⚠
            <Example> ✕⚠
      `);

      const id = ((store.getElementIDAtIndex(1): any): number);
      const rendererID = store.getRendererIDForElement(id);

      const {
        clearWarningsForElement,
      } = require('react-devtools-shared/src/backendAPI');
      clearWarningsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runAllTimers();

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 1
        [root]
            <Example> ✕⚠
            <Example> ✕
      `);
    });

    // @reactVersion >= 18.0
    it('can be cleared for a particular Fiber (only errors)', () => {
      function Example() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }
      const container = document.createElement('div');
      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <Example />
              <Example />
            </React.Fragment>,
            container,
          ),
        );
      });

      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <Example> ✕⚠
            <Example> ✕⚠
      `);

      const id = ((store.getElementIDAtIndex(1): any): number);
      const rendererID = store.getRendererIDForElement(id);

      const {
        clearErrorsForElement,
      } = require('react-devtools-shared/src/backendAPI');
      clearErrorsForElement({bridge, id, rendererID});

      // Flush events to the renderer.
      jest.runAllTimers();

      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 2
        [root]
            <Example> ✕⚠
            <Example> ⚠
      `);
    });

    // @reactVersion >= 18.0
    it('are updated when fibers are removed from the tree', () => {
      function ComponentWithWarning() {
        console.warn('test-only: render warning');
        return null;
      }
      function ComponentWithError() {
        console.error('test-only: render error');
        return null;
      }
      function ComponentWithWarningAndError() {
        console.error('test-only: render error');
        console.warn('test-only: render warning');
        return null;
      }
      const container = document.createElement('div');
      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <ComponentWithError />
              <ComponentWithWarning />
              <ComponentWithWarningAndError />
            </React.Fragment>,
            container,
          ),
        );
      });
      expect(store).toMatchInlineSnapshot(`
        ✕ 2, ⚠ 2
        [root]
            <ComponentWithError> ✕
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <ComponentWithWarning />
              <ComponentWithWarningAndError />
            </React.Fragment>,
            container,
          ),
        );
      });
      expect(store).toMatchInlineSnapshot(`
        ✕ 1, ⚠ 2
        [root]
            <ComponentWithWarning> ⚠
            <ComponentWithWarningAndError> ✕⚠
      `);

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() =>
          legacyRender(
            <React.Fragment>
              <ComponentWithWarning />
            </React.Fragment>,
            container,
          ),
        );
      });
      expect(store).toMatchInlineSnapshot(`
        ✕ 0, ⚠ 2
        [root]
            <ComponentWithWarning> ⚠
      `);

      withErrorsOrWarningsIgnored(['test-only:'], () => {
        act(() => legacyRender(<React.Fragment />, container));
      });
      expect(store).toMatchInlineSnapshot(`[root]`);
      expect(store.errorCount).toBe(0);
      expect(store.warningCount).toBe(0);
    });

    // Regression test for https://github.com/facebook/react/issues/23202
    // @reactVersion >= 18.0
    it('suspense boundary children should not double unmount and error', async () => {
      async function fakeImport(result) {
        return {default: result};
      }

      const ChildA = () => null;
      const ChildB = () => null;

      const LazyChildA = React.lazy(() => fakeImport(ChildA));
      const LazyChildB = React.lazy(() => fakeImport(ChildB));

      function App({renderA}) {
        return (
          <React.Suspense>
            {renderA ? <LazyChildA /> : <LazyChildB />}
          </React.Suspense>
        );
      }

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await actAsync(() => root.render(<App renderA={true} />));

      expect(store).toMatchInlineSnapshot(`
          [root]
            ▾ <App>
              ▾ <Suspense>
                  <ChildA>
        `);

      await actAsync(() => root.render(<App renderA={false} />));

      expect(store).toMatchInlineSnapshot(`
          [root]
            ▾ <App>
              ▾ <Suspense>
                  <ChildB>
        `);
    });
  });
});
