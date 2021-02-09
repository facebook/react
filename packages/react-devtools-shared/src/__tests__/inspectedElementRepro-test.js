describe('InspectedElement', () => {
  let React;
  let ReactDOM;
  let TestRenderer;
  let store;
  let utils;

  let Context;
  let TestUtils;

  let TestUtilsAct;
  let TestRendererAct;

  let testRendererInstance;
  let logs;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
    TestUtilsAct = TestUtils.unstable_concurrentAct;
    TestRenderer = utils.requireTestRenderer();
    TestRendererAct = TestUtils.unstable_concurrentAct;

    Context = React.createContext();

    // Used by inspectElementAtIndex() helper function
    testRendererInstance = TestRenderer.create(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createSimpleSuspenseCache() {
    const Pending = 0;
    const Resolved = 1;
    const Rejected = 2;

    function createMap() {
      return new WeakMap();
    }

    function getRecordMap() {
      return React.unstable_getCacheForType(createMap);
    }

    function readRecordValue(record) {
      if (record.status === Resolved) {
        return record.value;
      } else {
        throw record.value;
      }
    }

    function read(cacheKey) {
      const map = getRecordMap();
      let record = map.get(cacheKey);

      logs.push(`cache hit for ${cacheKey}? ${!!record}`);

      if (!record) {
        const callbacks = new Set();
        const wakeable = {
          then(callback) {
            callbacks.add(callback);
          },
        };
        const wake = () => {
          // This assumes they won't throw.
          callbacks.forEach(callback => callback());
          callbacks.clear();
        };
        const newRecord = (record = {
          status: Pending,
          value: wakeable,
        });

        readAPI(cacheKey).then(
          value => {
            const resolvedRecord = newRecord;
            resolvedRecord.status = Resolved;
            resolvedRecord.value = value;
            wake();
          },

          error => {
            if (newRecord.status === Pending) {
              const rejectedRecord = newRecord;
              rejectedRecord.status = Rejected;
              rejectedRecord.value = error.message;
              wake();
            }
          },
        );

        map.set(cacheKey, record);
      }

      return readRecordValue(record);
    }

    function readAPI(cacheKey) {
      return Promise.resolve(cacheKey);
    }

    return read;
  }

  // Renders an example component using React DOM that our fake DevTools will then inspect.
  async function renderAndMountTestComponentIntoDOM() {
    const Example = () => {
      const [state] = React.useState({
        foo: {
          bar: {
            baz: 'hi',
          },
        },
      });

      return state.foo.bar.baz;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              b: {
                c: [
                  {
                    d: {
                      e: {},
                    },
                  },
                ],
              },
            },
          }}
        />,
        container,
      ),
    );
  }

  // Render our fake DevTools and read the latest copy of our inspected element.
  async function inspectElementAtIndex(index, inspectElement, useCustomHook) {
    let didFinish = false;
    let inspectPaths = null;

    function Suspender() {
      const context = React.useContext(Context);
      inspectPaths = context.inspectPaths;
      didFinish = true;
      return null;
    }

    const id = store.getElementIDAtIndex(index);

    await utils.actAsync(() => {
      testRendererInstance.update(
        <React.Suspense fallback={null}>
          <ContextController
            inspectElement={inspectElement}
            selectedElementID={id}>
            <Suspender id={id} index={index} />
          </ContextController>
        </React.Suspense>,
      );
    }, false);

    expect(didFinish).toBe(true);

    return inspectPaths;
  }

  // This simulates DevTool's InspectedElementContext controller component.
  function ContextController({children, inspectElement, selectedElementID}) {
    const refresh = React.unstable_useCacheRefresh();

    // Track the paths insepected for the currently selected element.
    const [state, setState] = React.useState({
      element: null,
      path: null,
    });

    const element =
      selectedElementID !== null
        ? store.getElementByID(selectedElementID)
        : null;

    const elementHasChanged = element !== null && element !== state.element;

    // Reset the cached inspected paths when a new element is selected.
    if (elementHasChanged) {
      setState({
        element,
        path: null,
      });
    }

    logs.push(`Context ${element} path:${state.path}`);

    // Don't load a stale element from the backend; it wastes bridge bandwidth.
    let inspectedElement = null;
    if (!elementHasChanged && element !== null) {
      inspectedElement = inspectElement(element, state.path);
    }

    const inspectPaths = React.useCallback(
      path => {
        React.unstable_startTransition(() => {
          logs.push(`Inspecting path ${path}`);
          setState({
            element: state.element,
            path,
          });
          refresh();
        });
      },
      [setState, state],
    );

    // Reset path
    React.useEffect(() => {
      if (state.path !== null) {
        setState({
          element: state.element,
          path: null,
        });
      }
    }, [state]);

    const value = {
      inspectedElement,
      inspectPaths,
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  it('repro', async done => {
    logs = [];

    const read = createSimpleSuspenseCache();

    // This is the component we'll be "inspecting" later in the test.
    await renderAndMountTestComponentIntoDOM();

    // Render once to get a handle on inspectPaths()
    const inspectPaths = await inspectElementAtIndex(0, read);

    expect(logs).toEqual([
      // Render and suspend
      'Context Element 2 path:null',
      'Context Element 2 path:null',
      'cache hit for Element 2? false',

      // Resolve and render again
      'Context Element 2 path:null',
      'Context Element 2 path:null',
      'cache hit for Element 2? true',
    ]);

    logs.splice(0);

    async function loadPath(path) {
      TestUtilsAct(() => {
        TestRendererAct(() => {
          inspectPaths(path);
          jest.runOnlyPendingTimers();
        });
      });

      await inspectElementAtIndex(0, read);
    }

    await loadPath('foo.bar.baz');

    // This is the expected sequence:
    expect(logs).toEqual([
      'Inspecting path foo.bar.baz',

      // Render and re-suspend
      'Context Element 2 path:foo.bar.baz',
      'cache hit for Element 2? false',

      // Resolve and render again
      'Context Element 2 path:foo.bar.baz',
      'cache hit for Element 2? true',

      // Reset path and noop render again
      'Context Element 2 path:null',
      'cache hit for Element 2? true',
    ]);

    // This is the actual observed sequence:
    // Inspecting path foo.bar.baz
    //
    // Context Element 2 path:foo.bar.baz
    // cache hit for Element 2? true
    //
    // Context Element 2 path:null
    // cache hit for Element 2? true
    //
    // Context Element 2 path:null
    // cache hit for Element 2? false
    //
    // Context Element 2 path:null
    // cache hit for Element 2? true

    done();
  });
});
