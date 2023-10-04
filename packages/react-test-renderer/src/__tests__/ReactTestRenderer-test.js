/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactDOM;
let React;
let ReactCache;
let ReactTestRenderer;
let waitForAll;

describe('ReactTestRenderer', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactDOM = require('react-dom');

    // Isolate test renderer.
    jest.resetModules();
    React = require('react');
    ReactCache = require('react-cache');
    ReactTestRenderer = require('react-test-renderer');
    const InternalTestUtils = require('internal-test-utils');
    waitForAll = InternalTestUtils.waitForAll;
  });

  it('should warn if used to render a ReactDOM portal', () => {
    const container = document.createElement('div');
    expect(() => {
      let error;
      try {
        ReactTestRenderer.create(ReactDOM.createPortal('foo', container));
      } catch (e) {
        error = e;
      }
      // After the update throws, a subsequent render is scheduled to
      // unmount the whole tree. This update also causes an error, so React
      // throws an AggregateError.
      const errors = error.errors;
      expect(errors.length).toBe(2);
      expect(errors[0].message.includes('indexOf is not a function')).toBe(
        true,
      );
      expect(errors[1].message.includes('indexOf is not a function')).toBe(
        true,
      );
    }).toErrorDev('An invalid container has been provided.', {
      withoutStack: true,
    });
  });

  describe('timed out Suspense hidden subtrees should not be observable via toJSON', () => {
    let AsyncText;
    let PendingResources;
    let TextResource;

    beforeEach(() => {
      PendingResources = {};
      TextResource = ReactCache.unstable_createResource(
        text =>
          new Promise(resolve => {
            PendingResources[text] = resolve;
          }),
        text => text,
      );

      AsyncText = ({text}) => {
        const value = TextResource.read(text);
        return value;
      };
    });

    it('for root Suspense components', async () => {
      const App = ({text}) => {
        return (
          <React.Suspense fallback="fallback">
            <AsyncText text={text} />
          </React.Suspense>
        );
      };

      const root = ReactTestRenderer.create(<App text="initial" />);
      PendingResources.initial('initial');
      await waitForAll([]);
      expect(root.toJSON()).toEqual('initial');

      root.update(<App text="dynamic" />);
      expect(root.toJSON()).toEqual('fallback');

      PendingResources.dynamic('dynamic');
      await waitForAll([]);
      expect(root.toJSON()).toEqual('dynamic');
    });

    it('for nested Suspense components', async () => {
      const App = ({text}) => {
        return (
          <div>
            <React.Suspense fallback="fallback">
              <AsyncText text={text} />
            </React.Suspense>
          </div>
        );
      };

      const root = ReactTestRenderer.create(<App text="initial" />);
      PendingResources.initial('initial');
      await waitForAll([]);
      expect(root.toJSON().children).toEqual(['initial']);

      root.update(<App text="dynamic" />);
      expect(root.toJSON().children).toEqual(['fallback']);

      PendingResources.dynamic('dynamic');
      await waitForAll([]);
      expect(root.toJSON().children).toEqual(['dynamic']);
    });
  });

  it('repro for bug with useEffect synchronization', () => {
    const ListContext = React.createContext(null);
    const SelectionContext = React.createContext(null);

    function List(props) {
      const [expanded, setExpanded] = React.useState(new Set());
      const listContext = React.useMemo(() => {
        return {
          onExpanded(id) {
            setExpanded(prevExpanded => new Set([...prevExpanded, id]));
          },
        };
      }, []);
      const selectionContext = React.useMemo(() => {
        return {
          expanded,
        };
      }, [expanded]);
      return (
        <ListContext.Provider value={listContext}>
          <SelectionContext.Provider value={selectionContext}>
            {props.children}
          </SelectionContext.Provider>
        </ListContext.Provider>
      );
    }

    function ListItem(props) {
      const {onExpanded} = React.useContext(ListContext);
      const selectionContext = React.useContext(SelectionContext);
      const isExpanded = selectionContext.expanded.has(props.id);
      const didInitiallyExpand = React.useRef(false);
      const shouldInitiallyExpand =
        props.initiallyExpanded && didInitiallyExpand.current === false;
      const id = props.id;

      React.useEffect(() => {
        if (shouldInitiallyExpand) {
          didInitiallyExpand.current = true;
          onExpanded(id);
        }
      }, [shouldInitiallyExpand, onExpanded, id]);

      const expand = React.useCallback(() => {
        onExpanded(id);
      }, [id]);

      return isExpanded ? (
        <div>{props.children}</div>
      ) : (
        <div onClick={expand}>Expand</div>
      );
    }

    function Component() {
      return (
        <List>
          <ListItem id="1" initiallyExpanded={true}>
            Item 1
          </ListItem>
          <ListItem id="2" initiallyExpanded={true}>
            Item 2
          </ListItem>
          <ListItem id="3" initiallyExpanded={false}>
            Item 3
          </ListItem>
        </List>
      );
    }

    let renderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Component />);
    });
    const serialized = renderer.toJSON();
    expect(serialized).toMatchInlineSnapshot(`
      [
        <div
          onClick={[Function]}
        >
          Expand
        </div>,
        <div>
          Item 2
        </div>,
        <div
          onClick={[Function]}
        >
          Expand
        </div>,
      ]
    `);
  });
});
